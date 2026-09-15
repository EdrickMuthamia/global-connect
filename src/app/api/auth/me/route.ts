import { handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { publicUser } from "@/lib/db-helpers";

export const GET = handle(async () => {
  const user = await requireUser();
  return ok({ user: publicUser(user, { includeEmail: true }) });
});
