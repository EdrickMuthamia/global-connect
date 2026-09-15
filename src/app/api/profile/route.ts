import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handle, ok, readJson, vImage, vStr, vStringArray } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { publicUser } from "@/lib/db-helpers";

export const GET = handle(async () => {
  const me = await requireUser();
  return ok({ user: publicUser(me, { includeEmail: true }) });
});

/** PUT — update the signed-in member's profile (avatar, languages, interests, availability…). */
export const PUT = handle(async (req) => {
  const me = await requireUser();
  const body = await readJson(req);

  const name = vStr(body.name, { field: "Full name", min: 2, max: 80 });
  const bio = vStr(body.bio, { field: "Bio", max: 280, optional: true });
  const country = vStr(body.country, { field: "Country", max: 60, optional: true });
  const availability = vStr(body.availability, { field: "Availability", max: 60, optional: true });
  const languages = vStringArray(body.languages, { field: "Languages", maxItems: 8 });
  const interests = vStringArray(body.interests, { field: "Interests", maxItems: 12 });
  const avatarUrl = vImage(body.avatarUrl, "Profile picture");

  const [updated] = await db
    .update(users)
    .set({
      name,
      bio: bio || null,
      country: country || null,
      availability: availability || null,
      languages,
      interests,
      ...(avatarUrl !== null ? { avatarUrl } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, me.id))
    .returning();

  return ok({ user: publicUser(updated, { includeEmail: true }) });
});
