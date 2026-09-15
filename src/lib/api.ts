/**
 * Shared API helpers: consistent JSON envelope, typed errors, tiny
 * input validators and an in-memory rate limiter.
 */
import { NextResponse } from "next/server";

/* ------------------------------ Response shape ---------------------------- */

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(status: number, message: string, code?: string) {
  return NextResponse.json({ ok: false, error: message, code }, { status });
}

type RouteCtx = { params: Promise<Record<string, string>> };
type Handler = (req: Request, ctx: RouteCtx) => Promise<Response>;

/** Wraps a route handler with uniform error handling. */
export function handle(fn: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) return fail(e.status, e.message, e.code);
      console.error("[api error]", e);
      return fail(500, "Something went wrong on our side. Please try again.");
    }
  };
}

/* ------------------------------ Rate limiting ----------------------------- */

const buckets = new Map<string, { count: number; reset: number }>();

/** Throws 429 when the key exceeds `limit` calls inside `windowMs`. */
export function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    bucket = { count: 0, reset: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw new ApiError(429, "Too many requests. Please slow down for a moment.", "RATE_LIMITED");
  }
  // Occasional cleanup so the map doesn't grow forever.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  }
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/* -------------------------------- Validation ------------------------------ */

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "Invalid request body.");
  }
}

export function vEmail(value: unknown, field = "Email"): string {
  const email = String(value ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new ApiError(400, `${field} must be a valid email address.`);
  }
  if (email.length > 254) throw new ApiError(400, `${field} is too long.`);
  return email;
}

export function vStr(
  value: unknown,
  opts: { field: string; min?: number; max?: number; optional?: boolean },
): string {
  const str = String(value ?? "").trim();
  if (!str && opts.optional) return "";
  if (str.length < (opts.min ?? 1)) throw new ApiError(400, `${opts.field} is required.`);
  if (str.length > (opts.max ?? 500)) throw new ApiError(400, `${opts.field} is too long.`);
  return str;
}

export function vPassword(value: unknown): string {
  const pw = String(value ?? "");
  if (pw.length < 8) throw new ApiError(400, "Password must be at least 8 characters long.");
  if (pw.length > 128) throw new ApiError(400, "Password is too long.");
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) {
    throw new ApiError(400, "Password must contain both letters and numbers.");
  }
  return pw;
}

export function vInt(value: unknown, opts: { field: string; min: number; max: number }): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < opts.min || n > opts.max) {
    throw new ApiError(400, `${opts.field} must be between ${opts.min} and ${opts.max}.`);
  }
  return n;
}

export function vStringArray(value: unknown, opts: { field: string; maxItems?: number; maxLen?: number }): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new ApiError(400, `${opts.field} must be a list.`);
  const items = value
    .map((v) => String(v).trim())
    .filter(Boolean)
    .slice(0, opts.maxItems ?? 12);
  for (const item of items) {
    if (item.length > (opts.maxLen ?? 60)) throw new ApiError(400, `${opts.field} contains an entry that is too long.`);
  }
  return [...new Set(items)];
}

/** Accepts a reasonably-sized data URL (compressed client-side) or an absolute http(s) URL. */
export function vImage(value: unknown, field = "Image"): string | null {
  if (value === undefined || value === null || value === "") return null;
  const str = String(value);
  if (str.startsWith("data:image/")) {
    if (str.length > 450_000) throw new ApiError(400, `${field} is too large. Please choose a smaller image.`);
    return str;
  }
  if (/^https?:\/\//i.test(str) && str.length < 2000) return str;
  throw new ApiError(400, `${field} is not a valid image.`);
}

export function sixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function touchThrottle(): number {
  return 60_000; // 1 minute
}
