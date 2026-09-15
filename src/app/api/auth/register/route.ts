import { eq } from "drizzle-orm";
import { db } from "@/db";
import { authTokens, users } from "@/db/schema";
import { ApiError, clientIp, handle, ok, rateLimit, readJson, sixDigitCode, vEmail, vPassword, vStr } from "@/lib/api";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { notify, publicUser } from "@/lib/db-helpers";

export const POST = handle(async (req) => {
  rateLimit(`register:${clientIp(req)}`, 5, 60_000);
  const body = await readJson(req);
  const name = vStr(body.name, { field: "Full name", min: 2, max: 80 });
  const email = vEmail(body.email);
  const password = vPassword(body.password);

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) throw new ApiError(409, "An account with this email already exists. Try signing in.");

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash: await hashPassword(password) })
    .returning();

  // Email verification code (delivered via SMTP in production — surfaced here for the demo).
  const code = sixDigitCode();
  await db.insert(authTokens).values({
    userId: user.id,
    token: code,
    type: "email_verify",
    expiresAt: new Date(Date.now() + 30 * 60_000),
  });

  await setSessionCookie({ sub: user.id, role: user.role, name: user.name, email: user.email });
  await notify(user.id, {
    type: "system",
    title: "Karibu! Welcome to Global Connect",
    body: "Complete your profile, then activate your account to unlock messaging, calls and bookings.",
    link: "/dashboard/profile",
  });

  return ok({ user: publicUser(user, { includeEmail: true }), devCode: code });
});
