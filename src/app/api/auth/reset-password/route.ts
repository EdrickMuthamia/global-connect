import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { authTokens, users } from "@/db/schema";
import { ApiError, clientIp, handle, ok, rateLimit, readJson, vEmail, vPassword, vStr } from "@/lib/api";
import { hashPassword } from "@/lib/auth";

/** POST { email, code, password } — resets the password using a valid reset code. */
export const POST = handle(async (req) => {
  rateLimit(`reset:${clientIp(req)}`, 10, 60_000);
  const body = await readJson(req);
  const email = vEmail(body.email);
  const code = vStr(body.code, { field: "Reset code", min: 6, max: 6 });
  const password = vPassword(body.password);

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new ApiError(400, "That code is invalid or has expired.");

  const [token] = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.userId, user.id),
        eq(authTokens.type, "password_reset"),
        eq(authTokens.token, code),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!token) throw new ApiError(400, "That code is invalid or has expired. Request a new one.");

  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, token.id));
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return ok({ reset: true });
});
