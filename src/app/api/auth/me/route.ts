import { handle, ok } from "@/lib/api";
import { requireUser, setSessionCookie } from "@/lib/auth";
import { publicUser } from "@/lib/db-helpers";

export const GET = handle(async () => {
  const user = await requireUser();
  // Refresh cookie so status changes (e.g. activation) take effect immediately
  await setSessionCookie({ sub: user.id, role: user.role, name: user.name, email: user.email, status: user.status });
  return ok({ user: publicUser(user, { includeEmail: true }) });
});
