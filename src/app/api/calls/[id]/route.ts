import { eq } from "drizzle-orm";
import { db } from "@/db";
import { calls, users } from "@/db/schema";
import { ApiError, handle, ok, readJson, vStr } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { publicUser } from "@/lib/db-helpers";

async function loadCall(ctx: { params: Promise<Record<string, string>> }, meId: number) {
  const { id } = await ctx.params;
  const callId = Number(id);
  if (!Number.isInteger(callId)) throw new ApiError(400, "Invalid call id.");
  const [call] = await db.select().from(calls).where(eq(calls.id, callId)).limit(1);
  if (!call || (call.callerId !== meId && call.calleeId !== meId)) throw new ApiError(404, "Call not found.");
  return call;
}

/** GET — poll call state + WebRTC signaling payloads. */
export const GET = handle(async (_req, ctx) => {
  const me = await requireUser();
  const call = await loadCall(ctx, me.id);
  const otherId = call.callerId === me.id ? call.calleeId : call.callerId;
  const [other] = await db.select().from(users).where(eq(users.id, otherId)).limit(1);
  return ok({
    call,
    other: other ? publicUser(other) : null,
    role: call.callerId === me.id ? "caller" : "callee",
  });
});

/**
 * PATCH — WebRTC signaling + lifecycle.
 * { action: 'offer', sdp } · { action: 'answer', sdp } ·
 * { action: 'ice', role, candidate } · { action: 'end' | 'decline' }
 */
export const PATCH = handle(async (req, ctx) => {
  const me = await requireUser();
  const call = await loadCall(ctx, me.id);
  const body = await readJson(req);
  const action = vStr(body.action, { field: "Action", min: 2, max: 20 });
  const now = new Date();

  if (action === "offer") {
    if (call.callerId !== me.id) throw new ApiError(403, "Only the caller can send an offer.");
    const sdp = vStr(body.sdp, { field: "SDP", min: 10, max: 65_000 });
    await db.update(calls).set({ offerSdp: sdp }).where(eq(calls.id, call.id));
    return ok({ done: true });
  }

  if (action === "answer") {
    if (call.calleeId !== me.id) throw new ApiError(403, "Only the callee can answer.");
    const sdp = vStr(body.sdp, { field: "SDP", min: 10, max: 65_000 });
    await db
      .update(calls)
      .set({ answerSdp: sdp, status: "active", startedAt: call.startedAt ?? now })
      .where(eq(calls.id, call.id));
    return ok({ done: true });
  }

  if (action === "ice") {
    const candidate = body.candidate as unknown;
    if (!candidate || typeof candidate !== "object") throw new ApiError(400, "Invalid ICE candidate.");
    const raw = JSON.stringify(candidate);
    if (raw.length > 4000) throw new ApiError(400, "ICE candidate too large.");
    if (call.callerId === me.id) {
      await db
        .update(calls)
        .set({ callerCandidates: [...(call.callerCandidates ?? []), candidate] })
        .where(eq(calls.id, call.id));
    } else {
      await db
        .update(calls)
        .set({ calleeCandidates: [...(call.calleeCandidates ?? []), candidate] })
        .where(eq(calls.id, call.id));
    }
    return ok({ done: true });
  }

  if (action === "decline") {
    if (call.calleeId !== me.id) throw new ApiError(403, "Only the callee can decline.");
    await db.update(calls).set({ status: "declined", endedAt: now }).where(eq(calls.id, call.id));
    return ok({ done: true });
  }

  if (action === "end") {
    const nextStatus = call.status === "ringing" ? (call.callerId === me.id ? "missed" : "declined") : "ended";
    await db
      .update(calls)
      .set({ status: nextStatus, endedAt: now })
      .where(eq(calls.id, call.id));
    return ok({ done: true });
  }

  throw new ApiError(400, "Unknown action.");
});
