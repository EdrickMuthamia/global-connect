import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { authTokens, users } from "@/db/schema";
import { ApiError, clientIp, handle, ok, rateLimit, readJson, sixDigitCode, vEmail, vStr } from "@/lib/api";
import { publicUser } from "@/lib/db-helpers";

/** POST { email, code } verifies the address · POST { email, resend: true } issues a new code. */
export const POST = handle(async (req) => {
  rateLimit(`verify:${clientIp(req)}`, 12, 60_000);
  const body = await readJson(req);
  const email = vEmail(body.email);

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new ApiError(404, "No account found for that email.");

  if (body.resend === true) {
    const code = sixDigitCode();
    await db.insert(authTokens).values({
      userId: user.id,
      token: code,
      type: "email_verify",
      expiresAt: new Date(Date.now() + 30 * 60_000),
    });
    return ok({ sent: true, devCode: code });
  }

  const code = vStr(body.code, { field: "Verification code", min: 6, max: 6 });
  const [token] = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.userId, user.id),
        eq(authTokens.type, "email_verify"),
        eq(authTokens.token, code),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!token) throw new ApiError(400, "That code is invalid or has expired. Request a new one.");

  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, token.id));
  await db.update(users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(users.id, user.id));

  return ok({ verified: true, user: publicUser({ ...user, emailVerified: true }, { includeEmail: true }) });
});
