import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { ApiError, handle, ok, readJson, vStr } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/db-helpers";

/** PATCH { action: 'accept' | 'decline' | 'cancel' | 'complete' } — booking lifecycle. */
export const PATCH = handle(async (req, ctx) => {
  const me = await requireUser();
  const { id } = await ctx.params;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId)) throw new ApiError(400, "Invalid booking id.");
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking || (booking.requesterId !== me.id && booking.hostId !== me.id)) {
    throw new ApiError(404, "Booking not found.");
  }

  const body = await readJson(req);
  const action = vStr(body.action, { field: "Action", min: 2, max: 20 });
  const now = new Date();
  const isHost = booking.hostId === me.id;
  const counterpartId = isHost ? booking.requesterId : booking.hostId;

  let nextStatus: string;
  let noticeTitle = "";

  if (action === "accept") {
    if (!isHost) throw new ApiError(403, "Only the host can accept a session.");
    if (booking.status !== "pending") throw new ApiError(400, "This request was already handled.");
    nextStatus = "accepted";
    noticeTitle = `${me.name} accepted your session "${booking.topic}"`;
  } else if (action === "decline") {
    if (!isHost) throw new ApiError(403, "Only the host can decline a session.");
    if (booking.status !== "pending") throw new ApiError(400, "This request was already handled.");
    nextStatus = "declined";
    noticeTitle = `${me.name} declined your session "${booking.topic}"`;
  } else if (action === "cancel") {
    if (!["pending", "accepted"].includes(booking.status)) throw new ApiError(400, "This booking can no longer be cancelled.");
    nextStatus = "cancelled";
    noticeTitle = `${me.name} cancelled the session "${booking.topic}"`;
  } else if (action === "complete") {
    if (!isHost) throw new ApiError(403, "Only the host can mark a session complete.");
    if (booking.status !== "accepted") throw new ApiError(400, "Only accepted sessions can be completed.");
    nextStatus = "completed";
  } else {
    throw new ApiError(400, "Unknown action.");
  }

  const [updated] = await db
    .update(bookings)
    .set({ status: nextStatus, respondedAt: now })
    .where(eq(bookings.id, bookingId))
    .returning();

  if (noticeTitle) {
    await notify(counterpartId, {
      type: "booking",
      title: noticeTitle,
      body: updated.scheduledAt.toLocaleString(),
      link: "/dashboard/bookings",
    });
  }

  return ok({ booking: updated });
});
