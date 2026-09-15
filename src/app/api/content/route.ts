import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { announcements, faqs } from "@/db/schema";
import { handle, ok } from "@/lib/api";

/** GET /api/content — public FAQs and announcements (used by the landing page & dashboard). */
export const GET = handle(async () => {
  const [faqRows, announcementRows] = await Promise.all([
    db.select().from(faqs).where(eq(faqs.published, true)).orderBy(asc(faqs.sortOrder), asc(faqs.id)).limit(24),
    db.select().from(announcements).where(eq(announcements.published, true)).orderBy(desc(announcements.createdAt)).limit(5),
  ]);
  return ok({ faqs: faqRows, announcements: announcementRows });
});
