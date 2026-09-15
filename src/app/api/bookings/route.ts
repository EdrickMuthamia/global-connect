import { desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { bookings, users } from "@/db/schema";
import { ApiError, handle, ok, readJson, vInt, vStr } from "@/lib/api";
import { requireActive, requireUser } from "@/lib/auth";
import { isBlockedEitherWay, notify, publicUser } from "@/lib/db-helpers";

/** GET — my bookings (both sent and received), with the counterpart's info. */
export const GET = handle(async () => {
  const me = await requireUser();
  const rows = await db
    .select()
    .from(bookings)
    .where(or(eq(bookings.requesterId, me.id), eq(bookings.hostId, me.id)))
    .orderBy(desc(bookings.scheduledAt))
    .limit(120);

  const list = [];
  for (const b of rows) {
    const otherId = b.requesterId === me.id ? b.hostId : b.requesterId;
    const [other] = await db.select().from(users).where(eq(users.id, otherId)).limit(1);
    list.push({
      ...b,
      other: other ? publicUser(other) : null,
      direction: b.requesterId === me.id ? "sent" : "received",
    });
  }
  return ok({ bookings: list });
});

/** POST { hostId, topic, note?, scheduledAt, durationMin } — request a conversation session. */
export const POST = handle(async (req) => {
  const me = await requireUser();
  requireActive(me);
  const body = await readJson(req);
  const hostId = Number(body.hostId);
  if (!Number.isInteger(hostId) || hostId === me.id) throw new ApiError(400, "Invalid host.");

  const [host] = await db.select().from(users).where(eq(users.id, hostId)).limit(1);
  if (!host || host.status !== "active") throw new ApiError(404, "This member is not accepting bookings right now.");
  if (await isBlockedEitherWay(me.id, hostId)) throw new ApiError(403, "You cannot book this member.");

  const topic = vStr(body.topic, { field: "Topic", min: 3, max: 120 });
  const note = vStr(body.note, { field: "Note", max: 500, optional: true });
  const durationMin = vInt(body.durationMin, { field: "Duration", min: 15, max: 120 });
  const scheduledAt = new Date(String(body.scheduledAt ?? ""));
  if (isNaN(scheduledAt.getTime())) throw new ApiError(400, "Pick a valid date and time.");
  if (scheduledAt.getTime() < Date.now() + 10 * 60_000) throw new ApiError(400, "Sessions must be scheduled at least 10 minutes ahead.");
  if (scheduledAt.getTime() > Date.now() + 90 * 24 * 60 * 60_000) throw new ApiError(400, "Sessions can only be scheduled up to 90 days ahead.");

  const [booking] = await db
    .insert(bookings)
    .values({ requesterId: me.id, hostId, topic, note: note || null, scheduledAt, durationMin })
    .returning();

  await notify(hostId, {
    type: "booking",
    title: `New session request from ${me.name}`,
    body: `"${topic}" · ${scheduledAt.toLocaleString()}`,
    link: "/dashboard/bookings",
  });

  return ok({ booking });
});
