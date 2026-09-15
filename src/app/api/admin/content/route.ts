import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { announcements, faqs } from "@/db/schema";
import { ApiError, handle, ok, readJson, vInt, vStr } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

function vKind(value: unknown) {
  const kind = vStr(value, { field: "Kind", min: 3, max: 20 });
  if (kind !== "faq" && kind !== "announcement") throw new ApiError(400, "Kind must be faq or announcement.");
  return kind;
}

/** GET — all FAQs and announcements (including unpublished). */
export const GET = handle(async () => {
  await requireAdmin();
  const [faqRows, announcementRows] = await Promise.all([
    db.select().from(faqs).orderBy(faqs.sortOrder, faqs.id),
    db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(50),
  ]);
  return ok({ faqs: faqRows, announcements: announcementRows });
});

/** POST { kind, ... } — create FAQ or announcement. */
export const POST = handle(async (req) => {
  await requireAdmin();
  const body = await readJson(req);
  const kind = vKind(body.kind);

  if (kind === "faq") {
    const question = vStr(body.question, { field: "Question", min: 4, max: 200 });
    const answer = vStr(body.answer, { field: "Answer", min: 4, max: 1200 });
    const sortOrder = vInt(body.sortOrder ?? 0, { field: "Sort order", min: -100, max: 100 });
    const [faq] = await db.insert(faqs).values({ question, answer, sortOrder, published: body.published !== false }).returning();
    return ok({ faq });
  }

  const title = vStr(body.title, { field: "Title", min: 4, max: 160 });
  const bodyText = vStr(body.body, { field: "Body", min: 4, max: 1200 });
  const [announcement] = await db
    .insert(announcements)
    .values({ title, body: bodyText, published: body.published !== false })
    .returning();
  return ok({ announcement });
});

/** PATCH { kind, id, ... } — update. */
export const PATCH = handle(async (req) => {
  await requireAdmin();
  const body = await readJson(req);
  const kind = vKind(body.kind);
  const id = Number(body.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Invalid id.");

  if (kind === "faq") {
    const updates: Partial<typeof faqs.$inferInsert> = {};
    if (body.question !== undefined) updates.question = vStr(body.question, { field: "Question", min: 4, max: 200 });
    if (body.answer !== undefined) updates.answer = vStr(body.answer, { field: "Answer", min: 4, max: 1200 });
    if (body.sortOrder !== undefined) updates.sortOrder = vInt(body.sortOrder, { field: "Sort order", min: -100, max: 100 });
    if (body.published !== undefined) updates.published = Boolean(body.published);
    const [faq] = await db.update(faqs).set(updates).where(eq(faqs.id, id)).returning();
    if (!faq) throw new ApiError(404, "FAQ not found.");
    return ok({ faq });
  }

  const updates: Partial<typeof announcements.$inferInsert> = {};
  if (body.title !== undefined) updates.title = vStr(body.title, { field: "Title", min: 4, max: 160 });
  if (body.body !== undefined) updates.body = vStr(body.body, { field: "Body", min: 4, max: 1200 });
  if (body.published !== undefined) updates.published = Boolean(body.published);
  const [announcement] = await db.update(announcements).set(updates).where(eq(announcements.id, id)).returning();
  if (!announcement) throw new ApiError(404, "Announcement not found.");
  return ok({ announcement });
});

/** DELETE { kind, id } — remove. */
export const DELETE = handle(async (req) => {
  await requireAdmin();
  const body = await readJson(req);
  const kind = vKind(body.kind);
  const id = Number(body.id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Invalid id.");
  if (kind === "faq") await db.delete(faqs).where(eq(faqs.id, id));
  else await db.delete(announcements).where(eq(announcements.id, id));
  return ok({ deleted: true });
});
