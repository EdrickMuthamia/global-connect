import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handle, ok } from "@/lib/api";
import { clearSessionCookie, getSessionUser } from "@/lib/auth";

export const POST = handle(async () => {
  const user = await getSessionUser();
  if (user) {
    await db.update(users).set({ lastActiveAt: new Date(0) }).where(eq(users.id, user.id));
  }
  await clearSessionCookie();
  return ok({ signedOut: true });
});
