/** Server-side DB helpers shared across route handlers. */
import { and, desc, eq, gt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  blocks,
  conversationParticipants,
  conversations,
  notifications,
  reviews,
  users,
  type User,
} from "@/db/schema";

/** Shape of a user as exposed publicly (never leaks password hash or email). */
export function publicUser(u: User, opts: { includeEmail?: boolean } = {}) {
  return {
    id: u.id,
    name: u.name,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    country: u.country,
    languages: u.languages,
    interests: u.interests,
    availability: u.availability,
    sessionRateKes: u.sessionRateKes,
    isVerified: u.isVerified,
    lastActiveAt: u.lastActiveAt,
    createdAt: u.createdAt,
    ...(opts.includeEmail
      ? {
          email: u.email,
          role: u.role,
          status: u.status,
          emailVerified: u.emailVerified,
        }
      : {}),
  };
}

/** Touch lastActiveAt at most once a minute (powers "online now"). */
export async function touchUser(userId: number, lastActiveAt: Date | null) {
  try {
    if (!lastActiveAt || Date.now() - lastActiveAt.getTime() > 60_000) {
      await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, userId));
    }
  } catch {
    /* non-critical */
  }
}

export async function notify(
  userId: number,
  n: { type: string; title: string; body?: string; link?: string },
) {
  try {
    await db.insert(notifications).values({
      userId,
      type: n.type,
      title: n.title,
      body: n.body ?? null,
      link: n.link ?? null,
    });
  } catch (e) {
    console.error("[notify]", e);
  }
}

export async function notifyAdmins(n: { type: string; title: string; body?: string; link?: string }) {
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  await Promise.all(admins.map((a) => notify(a.id, n)));
}

export async function isBlockedEitherWay(a: number, b: number) {
  const rows = await db
    .select({ id: blocks.id })
    .from(blocks)
    .where(
      sql`(${blocks.blockerId} = ${a} AND ${blocks.blockedId} = ${b}) OR (${blocks.blockerId} = ${b} AND ${blocks.blockedId} = ${a})`,
    )
    .limit(1);
  return rows.length > 0;
}

/** Find (or create) the 1:1 conversation between two users. */
export async function getOrCreateConversation(a: number, b: number): Promise<number> {
  const existing = (await db.execute(sql`
    SELECT c.id FROM conversations c
    JOIN conversation_participants p1 ON p1.conversation_id = c.id AND p1.user_id = ${a}
    JOIN conversation_participants p2 ON p2.conversation_id = c.id AND p2.user_id = ${b}
    WHERE c.is_group = false
    LIMIT 1
  `)) as unknown as { rows: { id: number }[] };
  if (existing.rows.length > 0) return existing.rows[0].id;

  const [conv] = await db.insert(conversations).values({ isGroup: false }).returning();
  await db.insert(conversationParticipants).values([
    { conversationId: conv.id, userId: a },
    { conversationId: conv.id, userId: b },
  ]);
  return conv.id;
}

export async function isParticipant(conversationId: number, userId: number) {
  const rows = await db
    .select({ id: conversationParticipants.id, lastReadAt: conversationParticipants.lastReadAt })
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Average rating + count per user id. */
export async function ratingSummaries(userIds: number[]) {
  if (userIds.length === 0) return new Map<number, { avg: number; count: number }>();
  const rows = (await db.execute(sql`
    SELECT target_id AS id, AVG(rating)::float AS avg, COUNT(*)::int AS count
    FROM reviews
    WHERE target_id IN (${sql.join(userIds.map((id) => sql`${id}`), sql`, `)})
    GROUP BY target_id
  `)) as unknown as { rows: { id: number; avg: number; count: number }[] };
  const map = new Map<number, { avg: number; count: number }>();
  for (const r of rows.rows) map.set(r.id, { avg: Number(r.avg?.toFixed(2)), count: r.count });
  return map;
}

/** Recent reviews for a profile, with author info. */
export async function reviewsFor(targetId: number) {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      authorId: users.id,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
      authorCountry: users.country,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.authorId))
    .where(eq(reviews.targetId, targetId))
    .orderBy(desc(reviews.createdAt))
    .limit(30);
  return rows;
}

export async function activeOtherParticipants(conversationId: number, meId: number) {
  return db
    .select({ userId: conversationParticipants.userId, lastReadAt: conversationParticipants.lastReadAt })
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        ne(conversationParticipants.userId, meId),
      ),
    );
}

export { gt };
