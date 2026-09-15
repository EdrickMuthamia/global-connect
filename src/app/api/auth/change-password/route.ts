import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, handle, ok, readJson, vPassword } from "@/lib/api";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";

/** POST { currentPassword, newPassword } — authenticated password change. */
export const POST = handle(async (req) => {
  const user = await requireUser();
  const body = await readJson(req);
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = vPassword(body.newPassword);

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new ApiError(400, "Your current password is incorrect.");
  }
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return ok({ changed: true });
});
