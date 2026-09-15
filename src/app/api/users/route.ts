import { ne, desc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { publicUser, ratingSummaries } from "@/lib/db-helpers";
import { sql } from "drizzle-orm";

/** GET /api/users?q=&country=&language=&interest=&online=1&verified=1 — member search. */
export const GET = handle(async (req) => {
  const me = await requireUser();
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim().slice(0, 80) || "";
  const country = url.searchParams.get("country")?.trim() || "";
  const language = url.searchParams.get("language")?.trim() || "";
  const interest = url.searchParams.get("interest")?.trim() || "";
  const onlineOnly = url.searchParams.get("online") === "1";
  const verifiedOnly = url.searchParams.get("verified") === "1";

  const conds = [
    ne(users.id, me.id),
    ne(users.role, "admin"),
    ne(users.status, "banned"),
    ne(users.status, "suspended"),
    // Hide users where a block exists in either direction.
    sql`NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = ${me.id} AND b.blocked_id = ${users.id}) OR (b.blocker_id = ${users.id} AND b.blocked_id = ${me.id}))`,
  ];
  if (q) {
    const like = `%${q}%`;
    conds.push(sql`(${users.name} ILIKE ${like} OR COALESCE(${users.bio}, '') ILIKE ${like} OR COALESCE(${users.country}, '') ILIKE ${like})`);
  }
  if (country) conds.push(sql`${users.country} = ${country}`);
  if (language) conds.push(sql`EXISTS (SELECT 1 FROM jsonb_array_elements_text(${users.languages}) AS l WHERE l ILIKE ${`%${language}%`})`);
  if (interest) conds.push(sql`EXISTS (SELECT 1 FROM jsonb_array_elements_text(${users.interests}) AS i WHERE i ILIKE ${`%${interest}%`})`);
  if (onlineOnly) conds.push(sql`${users.lastActiveAt} > ${new Date(Date.now() - 5 * 60_000)}`);
  if (verifiedOnly) conds.push(sql`${users.isVerified} = true`);

  const rows = await db
    .select()
    .from(users)
    .where(sql.join(conds, sql` AND `))
    .orderBy(desc(users.lastActiveAt))
    .limit(60);

  const ratings = await ratingSummaries(rows.map((u) => u.id));
  const list = rows.map((u) => ({
    ...publicUser(u),
    rating: ratings.get(u.id)?.avg ?? null,
    ratingCount: ratings.get(u.id)?.count ?? 0,
  }));
  return ok({ users: list });
});
