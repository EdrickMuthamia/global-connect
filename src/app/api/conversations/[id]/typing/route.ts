import { and, eq, gt, ne } from "drizzle-orm";
import { db } from "@/db";
import { typingStates, users } from "@/db/schema";
import { ApiError, handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { isParticipant } from "@/lib/db-helpers";

async function guard(ctx: { params: Promise<Record<string, string>> }, meId: number) {
  const { id } = await ctx.params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) throw new ApiError(400, "Invalid conversation id.");
  const membership = await isParticipant(conversationId, meId);
  if (!membership) throw new ApiError(403, "You are not part of this conversation.");
  return conversationId;
}

/** POST — heartbeat "I'm typing" (expires in 4s). */
export const POST = handle(async (_req, ctx) => {
  const me = await requireUser();
  const conversationId = await guard(ctx, me.id);
  const expiresAt = new Date(Date.now() + 4000);
  const existing = await db
    .select({ id: typingStates.id })
    .from(typingStates)
    .where(and(eq(typingStates.conversationId, conversationId), eq(typingStates.userId, me.id)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(typingStates).set({ expiresAt }).where(eq(typingStates.id, existing[0].id));
  } else {
    await db.insert(typingStates).values({ conversationId, userId: me.id, expiresAt });
  }
  return ok({ typing: true });
});

/** GET — who else is typing right now. */
export const GET = handle(async (_req, ctx) => {
  const me = await requireUser();
  const conversationId = await guard(ctx, me.id);
  const rows = await db
    .select({ name: users.name })
    .from(typingStates)
    .innerJoin(users, eq(users.id, typingStates.userId))
    .where(
      and(
        eq(typingStates.conversationId, conversationId),
        ne(typingStates.userId, me.id),
        gt(typingStates.expiresAt, new Date()),
      ),
    )
    .limit(3);
  return ok({ typing: rows.map((r) => r.name) });
});
