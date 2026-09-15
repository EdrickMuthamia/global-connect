import { desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handle, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { publicUser } from "@/lib/db-helpers";

/** GET — platform analytics for the admin dashboard. */
export const GET = handle(async () => {
  await requireAdmin();

  const counts = (await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM users WHERE role = 'member') AS total_users,
      (SELECT COUNT(*)::int FROM users WHERE status = 'active') AS active_users,
      (SELECT COUNT(*)::int FROM users WHERE status = 'pending_activation') AS pending_users,
      (SELECT COUNT(*)::int FROM users WHERE status = 'suspended') AS suspended_users,
      (SELECT COUNT(*)::int FROM users WHERE is_verified = true) AS verified_users,
      (SELECT COUNT(*)::int FROM payments WHERE status = 'pending') AS pending_payments,
      (SELECT COUNT(*)::int FROM payments WHERE status = 'approved') AS approved_payments,
      (SELECT COALESCE(SUM(amount), 0)::int FROM payments WHERE status = 'approved') AS revenue_kes,
      (SELECT COUNT(*)::int FROM reports WHERE status = 'open') AS open_reports,
      (SELECT COUNT(*)::int FROM bookings) AS total_bookings,
      (SELECT COUNT(*)::int FROM bookings WHERE status = 'pending') AS pending_bookings,
      (SELECT COUNT(*)::int FROM messages) AS total_messages,
      (SELECT COUNT(*)::int FROM calls) AS total_calls,
      (SELECT COUNT(*)::int FROM reviews) AS total_reviews,
      (SELECT COALESCE(AVG(rating), 0)::float FROM reviews) AS avg_rating
  `)) as unknown as { rows: Record<string, number>[] };

  const growth = (await db.execute(sql`
    SELECT to_char(d.day, 'Mon DD') AS label, COALESCE(c.count, 0)::int AS count
    FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day') AS d(day)
    LEFT JOIN (
      SELECT DATE(created_at) AS day, COUNT(*)::int AS count
      FROM users GROUP BY DATE(created_at)
    ) c ON c.day = d.day
    ORDER BY d.day
  `)) as unknown as { rows: { label: string; count: number }[] };

  const recent = await db.select().from(users).orderBy(desc(users.createdAt)).limit(6);

  return ok({
    stats: counts.rows[0],
    growth: growth.rows,
    recentUsers: recent.map((u) => publicUser(u, { includeEmail: true })),
  });
});
