import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { blocks, users } from "@/db/schema";
import { ApiError, handle, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { publicUser } from "@/lib/db-helpers";

export const GET = handle(async () => {
  const me = await requireUser();
  const rows = await db
    .select({ id: blocks.id, createdAt: blocks.createdAt, user: users })
    .from(blocks)
    .innerJoin(users, eq(users.id, blocks.blockedId))
    .where(eq(blocks.blockerId, me.id))
    .orderBy(desc(blocks.createdAt));
  return ok({ blocked: rows.map((r) => ({ blockId: r.id, createdAt: r.createdAt, user: publicUser(r.user) })) });
});

export const POST = handle(async (req) => {
  const me = await requireUser();
  const body = await readJson(req);
  const userId = Number(body.userId);
  if (!Number.isInteger(userId)) throw new ApiError(400, "Invalid user id.");
  if (userId === me.id) throw new ApiError(400, "You cannot block yourself.");

  const existing = await db
    .select({ id: blocks.id })
    .from(blocks)
    .where(and(eq(blocks.blockerId, me.id), eq(blocks.blockedId, userId)))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(blocks).values({ blockerId: me.id, blockedId: userId });
  }
  return ok({ blocked: true });
});

export const DELETE = handle(async (req) => {
  const me = await requireUser();
  const body = await readJson(req);
  const userId = Number(body.userId);
  if (!Number.isInteger(userId)) throw new ApiError(400, "Invalid user id.");
  await db.delete(blocks).where(and(eq(blocks.blockerId, me.id), eq(blocks.blockedId, userId)));
  return ok({ blocked: false });
});
