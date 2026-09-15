import { desc, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, handle, ok, readJson, vStr } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { notify, publicUser } from "@/lib/db-helpers";

/** GET ?q=&status= — search/list all users. */
export const GET = handle(async (req) => {
  await requireAdmin();
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim().slice(0, 80) || "";
  const status = url.searchParams.get("status")?.trim() || "";

  const conds = [];
  if (q) {
    const like = `%${q}%`;
    conds.push(sql`(${users.name} ILIKE ${like} OR ${users.email} ILIKE ${like} OR COALESCE(${users.country}, '') ILIKE ${like})`);
  }
  if (["active", "pending_activation", "suspended", "banned"].includes(status)) {
    conds.push(sql`${users.status} = ${status}`);
  }

  const rows = await db
    .select()
    .from(users)
    .where(conds.length ? sql.join(conds, sql` AND `) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(100);

  return ok({ users: rows.map((u) => publicUser(u, { includeEmail: true })) });
});

/** PATCH { userId, action } — activate / suspend / ban / unsuspend / verify / unverify. */
export const PATCH = handle(async (req) => {
  const admin = await requireAdmin();
  const body = await readJson(req);
  const userId = Number(body.userId);
  const action = vStr(body.action, { field: "Action", min: 3, max: 20 });
  if (!Number.isInteger(userId)) throw new ApiError(400, "Invalid user id.");
  if (userId === admin.id) throw new ApiError(400, "You cannot modify your own admin account.");

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) throw new ApiError(404, "User not found.");
  if (target.role === "admin") throw new ApiError(400, "Admin accounts cannot be modified.");

  const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
  let notice = "";

  switch (action) {
    case "activate":
      updates.status = "active";
      notice = "Your account has been activated. All features are now unlocked!";
      break;
    case "suspend":
      updates.status = "suspended";
      notice = "Your account has been suspended. Please contact support.";
      break;
    case "ban":
      updates.status = "banned";
      break;
    case "restore":
      updates.status = "active";
      notice = "Your account has been restored. Welcome back!";
      break;
    case "verify":
      updates.isVerified = true;
      notice = "Congratulations! Your profile is now verified with a trust badge.";
      break;
    case "unverify":
      updates.isVerified = false;
      break;
    default:
      throw new ApiError(400, "Unknown action.");
  }

  const [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
  if (notice) {
    await notify(userId, {
      type: "system",
      title: notice,
      link: updates.status === "active" && action === "activate" ? "/dashboard" : undefined,
    });
  }
  return ok({ user: publicUser(updated, { includeEmail: true }) });
});
