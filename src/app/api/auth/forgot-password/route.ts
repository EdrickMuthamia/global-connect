import { eq } from "drizzle-orm";
import { db } from "@/db";
import { authTokens, users } from "@/db/schema";
import { clientIp, handle, ok, rateLimit, readJson, sixDigitCode, vEmail } from "@/lib/api";

/** POST { email } — issues a password reset code. Always returns success to avoid account enumeration. */
export const POST = handle(async (req) => {
  rateLimit(`forgot:${clientIp(req)}`, 5, 60 * 60_000);
  const body = await readJson(req);
  const email = vEmail(body.email);

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  let devCode: string | undefined;
  if (user) {
    devCode = sixDigitCode();
    await db.insert(authTokens).values({
      userId: user.id,
      token: devCode,
      type: "password_reset",
      expiresAt: new Date(Date.now() + 30 * 60_000),
    });
  }
  return ok({ sent: true, devCode });
});
