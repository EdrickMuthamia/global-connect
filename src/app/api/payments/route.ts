import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { ApiError, handle, ok, readJson, vImage, vStr } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { notifyAdmins } from "@/lib/db-helpers";

export const GET = handle(async () => {
  const me = await requireUser();
  const rows = await db.select().from(payments).where(eq(payments.userId, me.id)).orderBy(desc(payments.createdAt)).limit(10);
  return ok({ payments: rows });
});

/**
 * POST { reference, proofUrl?, note? } — submit M-Pesa paybill confirmation.
 * `method` + `payload` columns allow upgrading to automatic M-Pesa/card later.
 */
export const POST = handle(async (req) => {
  const me = await requireUser();
  if (me.status === "active") throw new ApiError(400, "Your account is already active.");

  const body = await readJson(req);
  const reference = vStr(body.reference, { field: "M-Pesa confirmation code", min: 6, max: 32 }).toUpperCase();
  if (!/^[A-Z0-9]+$/.test(reference)) throw new ApiError(400, "Confirmation code should only contain letters and numbers (e.g. QK7H2XYZ91).");
  const proofUrl = vImage(body.proofUrl, "Payment screenshot");
  const note = vStr(body.note, { field: "Note", max: 300, optional: true });

  // If a pending submission exists, refresh it instead of creating duplicates.
  const [pending] = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, me.id))
    .orderBy(desc(payments.createdAt))
    .limit(1);

  let saved;
  if (pending && pending.status === "pending") {
    [saved] = await db
      .update(payments)
      .set({ reference, proofUrl, note: note || null })
      .where(eq(payments.id, pending.id))
      .returning();
  } else {
    [saved] = await db
      .insert(payments)
      .values({ userId: me.id, reference, proofUrl, note: note || null, method: "mpesa_paybill", amount: 90, currency: "KES" })
      .returning();
  }

  await notifyAdmins({
    type: "payment",
    title: "New activation payment to verify",
    body: `${me.name} submitted M-Pesa reference ${reference}.`,
    link: "/admin?tab=payments",
  });

  return ok({ payment: saved });
});
