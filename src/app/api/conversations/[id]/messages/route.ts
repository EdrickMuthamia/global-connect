import { and, asc, desc, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { conversationParticipants, conversations, messages, users } from "@/db/schema";
import { ApiError, handle, ok, readJson, rateLimit, vImage, vStr } from "@/lib/api";
import { requireActive, requireUser } from "@/lib/auth";
import { activeOtherParticipants, isParticipant, publicUser } from "@/lib/db-helpers";

type Ctx = { params: Promise<Record<string, string>> };

async function loadConversation(ctx: Ctx, meId: number) {
  const { id } = await ctx.params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) throw new ApiError(400, "Invalid conversation id.");
  const membership = await isParticipant(conversationId, meId);
  if (!membership) throw new ApiError(403, "You are not part of this conversation.");
  return conversationId;
}

/** GET ?after=<iso> — messages ascending; also marks the conversation read for me. */
export const GET = handle(async (req, ctx) => {
  const me = await requireUser();
  const conversationId = await loadConversation(ctx, me.id);

  const after = new URL(req.url).searchParams.get("after");
  const afterDate = after ? new Date(after) : null;
  const conds = [eq(messages.conversationId, conversationId)];
  if (afterDate && !isNaN(afterDate.getTime())) {
    conds.push(sql`${messages.createdAt} > ${afterDate}` as never);
  }
  const rows = await db
    .select()
    .from(messages)
    .where(and(...conds))
    .orderBy(asc(messages.createdAt))
    .limit(200);

  // Read receipts: mark my lastReadAt + report the other participant's.
  await db
    .update(conversationParticipants)
    .set({ lastReadAt: new Date() })
    .where(and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, me.id)));
  const [otherPart] = await activeOtherParticipants(conversationId, me.id);

  return ok({ messages: rows, otherLastReadAt: otherPart?.lastReadAt ?? null });
});

/** POST { content? , imageUrl? } — send a message (text or image). Requires an active account. */
export const POST = handle(async (req, ctx) => {
  const me = await requireUser();
  rateLimit(`msg:${me.id}`, 60, 60_000);
  const conversationId = await loadConversation(ctx, me.id);
  requireActive(me);

  const body = await readJson(req);
  const imageUrl = vImage(body.imageUrl, "Image");
  const content = vStr(body.content, { field: "Message", max: 2000, optional: true });
  if (!imageUrl && !content) throw new ApiError(400, "Type a message or attach an image first.");

  const [message] = await db
    .insert(messages)
    .values({
      conversationId,
      senderId: me.id,
      kind: imageUrl ? "image" : "text",
      content: content || null,
      imageUrl,
    })
    .returning();
  await db.update(conversations).set({ lastMessageAt: message.createdAt }).where(eq(conversations.id, conversationId));
  await db
    .update(conversationParticipants)
    .set({ lastReadAt: new Date() })
    .where(and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, me.id)));

  // Notify the other participant (throttled to one notification / 10 min / conversation).
  const [otherPart] = await activeOtherParticipants(conversationId, me.id);
  if (otherPart) {
    const link = `/dashboard/messages?c=${conversationId}`;
    const recent = (await db.execute(sql`
      SELECT id FROM notifications
      WHERE user_id = ${otherPart.userId} AND type = 'message' AND link = ${link}
      AND created_at > ${new Date(Date.now() - 10 * 60_000)}
      LIMIT 1
    `)) as unknown as { rows: { id: number }[] };
    if (recent.rows.length === 0) {
      const { notify } = await import("@/lib/db-helpers");
      const [sender] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
      await notify(otherPart.userId, {
        type: "message",
        title: `New message from ${sender.name}`,
        body: imageUrl ? "Sent you a photo" : content.slice(0, 120),
        link,
      });
    }
  }

  return ok({ message, sender: publicUser(me) });
});
