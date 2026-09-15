import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversationParticipants } from "@/db/schema";
import { ApiError, handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";

/** POST — explicitly mark a conversation as read. */
export const POST = handle(async (_req, ctx) => {
  const me = await requireUser();
  const { id } = await ctx.params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) throw new ApiError(400, "Invalid conversation id.");
  await db
    .update(conversationParticipants)
    .set({ lastReadAt: new Date() })
    .where(and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, me.id)));
  return ok({ read: true });
});
