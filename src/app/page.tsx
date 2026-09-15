import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { faqs } from "@/db/schema";
import { Landing } from "@/components/landing";

export const dynamic = "force-dynamic";

async function getFaqs() {
  try {
    return await db
      .select({ id: faqs.id, question: faqs.question, answer: faqs.answer })
      .from(faqs)
      .where(eq(faqs.published, true))
      .orderBy(asc(faqs.sortOrder), asc(faqs.id))
      .limit(12);
  } catch {
    // DB not migrated yet — the landing page falls back to built-in FAQs.
    return [];
  }
}

export default async function HomePage() {
  const faqList = await getFaqs();
  return <Landing faqs={faqList} />;
}
