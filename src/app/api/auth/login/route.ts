import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, clientIp, handle, ok, rateLimit, readJson, vEmail } from "@/lib/api";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { publicUser } from "@/lib/db-helpers";

export const POST = handle(async (req) => {
  rateLimit(`login:${clientIp(req)}`, 10, 60_000);
  const body = await readJson(req);
  const email = vEmail(body.email);
  const password = String(body.password ?? "");

  let user;
  try {
    [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  } catch {
    throw new ApiError(503, "Database is not reachable. Please check your DATABASE_URL environment variable on Vercel.");
  }

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new ApiError(401, "Incorrect email or password.");
  }
  if (user.status === "banned") throw new ApiError(403, "This account has been banned. Please contact support.");
  if (user.status === "suspended") throw new ApiError(403, "This account is suspended. Please contact support.");

  await setSessionCookie({ sub: user.id, role: user.role, name: user.name, email: user.email });
  await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, user.id));

  return ok({ user: publicUser(user, { includeEmail: true }) });
});
