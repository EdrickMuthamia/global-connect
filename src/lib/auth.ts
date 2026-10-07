/**
 * Authentication utilities — bcrypt password hashing + JWT sessions (jose)
 * stored in an httpOnly, SameSite=Lax cookie. The SameSite policy plus
 * JSON-only mutation endpoints provides CSRF protection.
 */
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { ApiError } from "@/lib/api";

export const SESSION_COOKIE = "gc_token";
const SESSION_DAYS = 7;

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "global-connect-dev-secret-change-in-production",
);

export interface SessionPayload {
  sub: number;
  role: string;
  name: string;
  email: string;
  status: string;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ role: payload.role, name: payload.name, email: payload.email, status: payload.status })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.sub))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: Number(payload.sub),
      role: String(payload.role || "member"),
      name: String(payload.name || ""),
      email: String(payload.email || ""),
      status: String(payload.status || "pending_activation"),
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Returns the freshly-loaded session user, or null. Banned/suspended users get no session. */
export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  try {
    const [user] = await db.select().from(users).where(eq(users.id, session.sub)).limit(1);
    if (!user || user.status === "banned" || user.status === "suspended") return null;
    return user;
  } catch {
    return null;
  }
}

/** Throws 401 unless a valid, non-suspended session exists. Touches lastActiveAt. */
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Please sign in to continue.", "UNAUTHENTICATED");
  // Presence: refresh lastActiveAt at most once per minute.
  if (!user.lastActiveAt || Date.now() - user.lastActiveAt.getTime() > 60_000) {
    db.update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, user.id))
      .catch(() => {});
  }
  return user;
}

/** Throws 403 unless the session belongs to an admin. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") throw new ApiError(403, "Administrator access required.", "FORBIDDEN");
  return user;
}

/** Premium features require an activated account (KSh 90 activation). */
export function requireActive(user: User) {
  if (user.role === "admin") return;
  if (user.status !== "active") {
    throw new ApiError(
      403,
      "Activate your account for KSh 90 to unlock this feature.",
      "NEEDS_ACTIVATION",
    );
  }
}
