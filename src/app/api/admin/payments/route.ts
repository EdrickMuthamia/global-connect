import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { ApiError, handle, ok, readJson, vStr } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { notify, publicUser } from "@/lib/db-helpers";

/**
 * GET ?status=pending|approved|rejected — payment submissions.
 * GET ?id=123 — one payment including the proof image (loaded on demand).
 */
export const GET = handle(async (req) => {
  await requireAdmin();
  const url = new URL(req.url);

  const id = Number(url.searchParams.get("id"));
  if (Number.isInteger(id) && id > 0) {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    if (!payment) throw new ApiError(404, "Payment not found.");
    const [user] = await db.select().from(users).where(eq(users.id, payment.userId)).limit(1);
    return ok({ payment, user: user ? publicUser(user, { includeEmail: true }) : null });
  }

  const status = url.searchParams.get("status") || "";
  const rows = await db
    .select({
      payment: {
        id: payments.id,
        userId: payments.userId,
        amount: payments.amount,
        currency: payments.currency,
        method: payments.method,
        reference: payments.reference,
        note: payments.note,
        status: payments.status,
        createdAt: payments.createdAt,
        hasProof: payments.proofUrl,
      },
      user: users,
    })
    .from(payments)
    .innerJoin(users, eq(users.id, payments.userId))
    .where(["pending", "approved", "rejected"].includes(status) ? eq(payments.status, status) : undefined)
    .orderBy(desc(payments.createdAt))
    .limit(100);

  return ok({
    payments: rows.map((r) => ({
      ...r.payment,
      hasProof: Boolean(r.payment.hasProof),
      user: publicUser(r.user, { includeEmail: true }),
    })),
  });
});

/** PATCH { id, action: 'approve' | 'reject', note? } — verify a payment; approving activates the account. */
export const PATCH = handle(async (req) => {
  const admin = await requireAdmin();
  const body = await readJson(req);
  const id = Number(body.id);
  const action = vStr(body.action, { field: "Action", min: 3, max: 20 });
  const note = vStr(body.note, { field: "Note", max: 300, optional: true });
  if (!Number.isInteger(id)) throw new ApiError(400, "Invalid payment id.");

  const [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  if (!payment) throw new ApiError(404, "Payment not found.");
  if (payment.status !== "pending") throw new ApiError(400, "This payment was already reviewed.");

  if (action === "approve") {
    await db
      .update(payments)
      .set({ status: "approved", reviewedBy: admin.id, reviewNote: note || null, reviewedAt: new Date() })
      .where(eq(payments.id, id));
    await db.update(users).set({ status: "active", updatedAt: new Date() }).where(eq(users.id, payment.userId));
    await notify(payment.userId, {
      type: "payment",
      title: "Payment verified — your account is now Active!",
      body: "All premium features are unlocked: messaging, voice & video calls, and bookings.",
      link: "/dashboard",
    });
    return ok({ status: "approved" });
  }

  if (action === "reject") {
    await db
      .update(payments)
      .set({ status: "rejected", reviewedBy: admin.id, reviewNote: note || "Reference could not be verified.", reviewedAt: new Date() })
      .where(eq(payments.id, id));
    await notify(payment.userId, {
      type: "payment",
      title: "Payment could not be verified",
      body: note || "Please check your M-Pesa confirmation code and resubmit.",
      link: "/dashboard/activate",
    });
    return ok({ status: "rejected" });
  }

  throw new ApiError(400, "Unknown action.");
});
