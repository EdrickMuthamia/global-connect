import { eq } from "drizzle-orm";
import { db } from "@/db";
import { reports, users } from "@/db/schema";
import { ApiError, handle, ok, readJson, vStr } from "@/lib/api";
import { rateLimit } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { notifyAdmins } from "@/lib/db-helpers";

/** POST { targetId, reason, details? } — report an abusive member. */
export const POST = handle(async (req) => {
  const me = await requireUser();
  rateLimit(`report:${me.id}`, 10, 60 * 60_000);
  const body = await readJson(req);
  const targetId = Number(body.targetId);
  if (!Number.isInteger(targetId)) throw new ApiError(400, "Invalid user id.");
  if (targetId === me.id) throw new ApiError(400, "You cannot report yourself.");

  const [target] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  if (!target) throw new ApiError(404, "Member not found.");

  const reason = vStr(body.reason, { field: "Reason", min: 3, max: 120 });
  const details = vStr(body.details, { field: "Details", max: 1000, optional: true });

  const [report] = await db
    .insert(reports)
    .values({ reporterId: me.id, reportedUserId: targetId, reason, details: details || null })
    .returning();

  await notifyAdmins({
    type: "report",
    title: "New member report",
    body: `${me.name} reported ${target.name} · ${reason}`,
    link: "/admin?tab=reports",
  });

  return ok({ report });
});
