import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { reviews, users } from "@/db/schema";
import { ApiError, handle, ok, readJson, vInt, vStr } from "@/lib/api";
import { requireActive, requireUser } from "@/lib/auth";
import { isBlockedEitherWay, notify, ratingSummaries, reviewsFor } from "@/lib/db-helpers";

/** GET ?userId= — reviews + summary for a member. */
export const GET = handle(async (req) => {
  await requireUser();
  const userId = Number(new URL(req.url).searchParams.get("userId"));
  if (!Number.isInteger(userId)) throw new ApiError(400, "Invalid user id.");
  const summaries = await ratingSummaries([userId]);
  const list = await reviewsFor(userId);
  return ok({ reviews: list, rating: summaries.get(userId)?.avg ?? null, ratingCount: summaries.get(userId)?.count ?? 0 });
});

/** POST { targetId, rating, comment? } — leave or update a review (one per member pair). */
export const POST = handle(async (req) => {
  const me = await requireUser();
  requireActive(me);
  const body = await readJson(req);
  const targetId = Number(body.targetId);
  if (!Number.isInteger(targetId) || targetId === me.id) throw new ApiError(400, "Invalid member.");

  const [target] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  if (!target || target.status === "banned" || target.status === "suspended") throw new ApiError(404, "Member not found.");
  if (await isBlockedEitherWay(me.id, targetId)) throw new ApiError(403, "You cannot review this member.");

  const rating = vInt(body.rating, { field: "Rating", min: 1, max: 5 });
  const comment = vStr(body.comment, { field: "Review", max: 600, optional: true });

  const existing = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.authorId, me.id), eq(reviews.targetId, targetId)))
    .limit(1);

  let saved;
  if (existing.length > 0) {
    [saved] = await db
      .update(reviews)
      .set({ rating, comment: comment || null, createdAt: new Date() })
      .where(eq(reviews.id, existing[0].id))
      .returning();
  } else {
    [saved] = await db.insert(reviews).values({ authorId: me.id, targetId, rating, comment: comment || null }).returning();
    await notify(targetId, {
      type: "system",
      title: `${me.name} left you a ${rating}-star review`,
      body: comment ? comment.slice(0, 140) : undefined,
      link: `/dashboard/members/${me.id}`,
    });
  }
  return ok({ review: saved });
});
