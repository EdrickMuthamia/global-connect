import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { handle, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const GET = handle(async () => {
  const me = await requireUser();
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, me.id))
    .orderBy(desc(notifications.createdAt))
    .limit(60);
  const result = (await db.execute(
    sql`SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = ${me.id} AND read = false`,
  )) as unknown as { rows: { count: number }[] };
  return ok({ notifications: rows, unreadCount: result.rows[0]?.count ?? 0 });
});

/** PATCH { ids?: number[], all?: boolean } — mark notifications read. */
export const PATCH = handle(async (req) => {
  const me = await requireUser();
  const body = await readJson(req);
  if (body.all === true) {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, me.id));
  } else if (Array.isArray(body.ids) && body.ids.length > 0) {
    const ids = body.ids.map(Number).filter(Number.isInteger).slice(0, 60);
    if (ids.length > 0) {
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.userId, me.id), inArray(notifications.id, ids)));
    }
  }
  return ok({ updated: true });
});
