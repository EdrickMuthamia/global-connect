import { desc, eq, or } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { calls, users } from "@/db/schema";
import { ApiError, handle, ok, readJson, vStr } from "@/lib/api";
import { requireActive, requireUser } from "@/lib/auth";
import { isBlockedEitherWay, notify, publicUser } from "@/lib/db-helpers";

/** GET — `?incoming=1` returns ringing calls for me; otherwise my call history. */
export const GET = handle(async (req) => {
  const me = await requireUser();
  const url = new URL(req.url);

  if (url.searchParams.get("incoming") === "1") {
    const ringing = await db
      .select({ call: calls, caller: users })
      .from(calls)
      .innerJoin(users, eq(users.id, calls.callerId))
      .where(sql`${calls.calleeId} = ${me.id} AND ${calls.status} = 'ringing' AND ${calls.createdAt} > ${new Date(Date.now() - 90_000)}`)
      .orderBy(desc(calls.createdAt))
      .limit(3);
    return ok({ incoming: ringing.map((r) => ({ ...r.call, caller: publicUser(r.caller) })) });
  }

  const rows = await db
    .select({
      call: calls,
      caller: { id: users.id, name: users.name, avatarUrl: users.avatarUrl },
    })
    .from(calls)
    .innerJoin(users, eq(users.id, calls.callerId))
    .where(or(eq(calls.callerId, me.id), eq(calls.calleeId, me.id)))
    .orderBy(desc(calls.createdAt))
    .limit(40);

  const withOthers = [];
  for (const r of rows) {
    const otherId = r.call.callerId === me.id ? r.call.calleeId : r.call.callerId;
    const [other] = await db.select().from(users).where(eq(users.id, otherId)).limit(1);
    withOthers.push({ ...r.call, other: other ? publicUser(other) : null, direction: r.call.callerId === me.id ? "outgoing" : "incoming" });
  }
  return ok({ calls: withOthers });
});

/** POST { calleeId, type: 'voice' | 'video' } — start a call. Requires an active account. */
export const POST = handle(async (req) => {
  const me = await requireUser();
  requireActive(me);
  const body = await readJson(req);
  const calleeId = Number(body.calleeId);
  const type = vStr(body.type, { field: "Call type", min: 1, max: 10 });
  if (!["voice", "video"].includes(type)) throw new ApiError(400, "Call type must be voice or video.");
  if (!Number.isInteger(calleeId) || calleeId === me.id) throw new ApiError(400, "Invalid callee.");

  const [callee] = await db.select().from(users).where(eq(users.id, calleeId)).limit(1);
  if (!callee || callee.status !== "active") throw new ApiError(404, "This member is not available for calls.");
  if (await isBlockedEitherWay(me.id, calleeId)) throw new ApiError(403, "You cannot call this member.");

  const existing = (await db.execute(sql`
    SELECT id FROM calls WHERE status IN ('ringing','active')
    AND ((caller_id = ${me.id} AND callee_id = ${calleeId}) OR (caller_id = ${calleeId} AND callee_id = ${me.id}))
    LIMIT 1
  `)) as unknown as { rows: { id: number }[] };
  if (existing.rows.length > 0) throw new ApiError(409, "There is already an ongoing call with this member.");

  const [call] = await db
    .insert(calls)
    .values({ callerId: me.id, calleeId, type, status: "ringing" })
    .returning();

  await notify(calleeId, {
    type: "call",
    title: `Incoming ${type} call from ${me.name}`,
    link: `/dashboard/calls?incoming=${call.id}`,
  });

  return ok({ call });
});
