import { desc, eq, ne, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { conversationParticipants, conversations, messages, users } from "@/db/schema";
import { ApiError, handle, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getOrCreateConversation, isBlockedEitherWay, publicUser } from "@/lib/db-helpers";

/** GET — my conversations with the other participant, last message and unread count. */
export const GET = handle(async () => {
  const me = await requireUser();
  const memberships = await db
    .select()
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, me.id));

  const result = [];
  for (const m of memberships) {
    const [other] = await db
      .select({ user: users, lastReadAt: conversationParticipants.lastReadAt })
      .from(conversationParticipants)
      .innerJoin(users, eq(users.id, conversationParticipants.userId))
      .where(and(eq(conversationParticipants.conversationId, m.conversationId), ne(conversationParticipants.userId, me.id)))
      .limit(1);
    if (!other) continue;

    const [last] = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, m.conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    const unread = (await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM messages
      WHERE conversation_id = ${m.conversationId} AND sender_id <> ${me.id}
      AND created_at > ${m.lastReadAt ?? new Date(0)}
    `)) as unknown as { rows: { count: number }[] };

    result.push({
      id: m.conversationId,
      other: publicUser(other.user),
      lastMessage: last ?? null,
      unreadCount: unread.rows[0]?.count ?? 0,
      lastMessageAt: last?.createdAt ?? null,
    });
  }

  result.sort((a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime());
  return ok({ conversations: result });
});

/** POST { userId } — open (or create) the 1:1 conversation with a member. */
export const POST = handle(async (req) => {
  const me = await requireUser();
  const body = await readJson(req);
  const userId = Number(body.userId);
  if (!Number.isInteger(userId)) throw new ApiError(400, "Invalid user id.");
  if (userId === me.id) throw new ApiError(400, "You cannot chat with yourself.");

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target || target.status === "banned" || target.status === "suspended") {
    throw new ApiError(404, "Member not found.");
  }
  if (await isBlockedEitherWay(me.id, userId)) {
    throw new ApiError(403, "You cannot message this member.");
  }

  const conversationId = await getOrCreateConversation(me.id, userId);
  return ok({ conversationId, other: publicUser(target) });
});
