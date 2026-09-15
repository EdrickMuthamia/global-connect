import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reports, users } from "@/db/schema";
import { ApiError, handle, ok, readJson, vStr } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { notify, publicUser } from "@/lib/db-helpers";

/** GET ?status=open|resolved|dismissed — moderation queue. */
export const GET = handle(async (req) => {
  await requireAdmin();
  const status = new URL(req.url).searchParams.get("status") || "";
  const rows = await db
    .select()
    .from(reports)
    .where(["open", "resolved", "dismissed"].includes(status) ? eq(reports.status, status) : undefined)
    .orderBy(desc(reports.createdAt))
    .limit(100);

  const list = [];
  for (const r of rows) {
    const [reporter] = await db.select().from(users).where(eq(users.id, r.reporterId)).limit(1);
    const [reported] = await db.select().from(users).where(eq(users.id, r.reportedUserId)).limit(1);
    list.push({
      ...r,
      reporter: reporter ? publicUser(reporter, { includeEmail: true }) : null,
      reportedUser: reported ? publicUser(reported, { includeEmail: true }) : null,
    });
  }
  return ok({ reports: list });
});

/** PATCH { id, action: 'resolve' | 'dismiss', note?, suspendUser? } — handle a report. */
export const PATCH = handle(async (req) => {
  const admin = await requireAdmin();
  const body = await readJson(req);
  const id = Number(body.id);
  const action = vStr(body.action, { field: "Action", min: 3, max: 20 });
  const note = vStr(body.note, { field: "Note", max: 500, optional: true });
  if (!Number.isInteger(id)) throw new ApiError(400, "Invalid report id.");

  const [report] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  if (!report) throw new ApiError(404, "Report not found.");

  if (!["resolve", "dismiss"].includes(action)) throw new ApiError(400, "Unknown action.");
  const status = action === "resolve" ? "resolved" : "dismissed";

  await db
    .update(reports)
    .set({ status, resolutionNote: note || null, reviewedBy: admin.id, resolvedAt: new Date() })
    .where(eq(reports.id, id));

  if (action === "resolve" && body.suspendUser === true) {
    const [reported] = await db.select().from(users).where(eq(users.id, report.reportedUserId)).limit(1);
    if (reported && reported.role !== "admin") {
      await db.update(users).set({ status: "suspended", updatedAt: new Date() }).where(eq(users.id, reported.id));
    }
  }

  await notify(report.reporterId, {
    type: "report",
    title: `Your report has been ${status}`,
    body: note || "Thank you for keeping Global Connect safe.",
  });

  return ok({ status });
});
