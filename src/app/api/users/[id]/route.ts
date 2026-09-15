import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { isBlockedEitherWay, publicUser, ratingSummaries, reviewsFor } from "@/lib/db-helpers";

/** GET /api/users/:id — public member profile with reviews and ratings. */
export const GET = handle(async (_req, ctx) => {
  const me = await requireUser();
  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) throw new ApiError(400, "Invalid user id.");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.status === "banned" || user.status === "suspended") {
    throw new ApiError(404, "This member could not be found.");
  }

  const blocked = userId === me.id ? false : await isBlockedEitherWay(me.id, userId);
  const ratings = await ratingSummaries([userId]);
  const reviews = await reviewsFor(userId);

  return ok({
    user: publicUser(user),
    rating: ratings.get(userId)?.avg ?? null,
    ratingCount: ratings.get(userId)?.count ?? 0,
    reviews,
    blocked,
    isSelf: userId === me.id,
  });
});
