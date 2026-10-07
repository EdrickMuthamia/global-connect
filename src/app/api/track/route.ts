import { db } from "@/db";
import { pageViews } from "@/db/schema";
import { handle, ok, readJson } from "@/lib/api";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { cookies } from "next/headers";

export const POST = handle(async (req) => {
  const { path } = await readJson(req);
  let userId: number | null = null;
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token) {
      const session = await verifySessionToken(token);
      userId = session?.sub ?? null;
    }
  } catch { /* non-critical */ }
  await db.insert(pageViews).values({ path: String(path).slice(0, 200), userId });
  return ok({});
});
