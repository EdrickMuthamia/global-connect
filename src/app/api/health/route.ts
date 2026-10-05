import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, db: true });
  } catch {
    // Return 200 so the login page health check doesn't show a false alarm.
    // The DB error will surface naturally when the user tries to log in.
    return Response.json({ ok: true, db: false });
  }
}
