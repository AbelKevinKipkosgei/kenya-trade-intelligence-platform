import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db/client";
import { userProfiles, users, sectors, counties, agencies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProfileView } from "@/components/profile/profile-view";

/**
 * User profile page.
 * Displays user information and profile data with edit capability.
 */
export default async function ProfilePage() {
  const session = await requireAuth();
  const userId = parseInt(session.user.id);

  // Fetch user data
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    redirect("/auth/signin");
  }

  // Fetch profile with related data
  const [profile] = await db
    .select({
      profile: userProfiles,
      sector: sectors,
      agency: agencies,
    })
    .from(userProfiles)
    .leftJoin(sectors, eq(userProfiles.primarySectorId, sectors.id))
    .leftJoin(agencies, eq(userProfiles.agencyId, agencies.id))
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  // Fetch counties if profile exists and has counties
  let profileCounties: Array<{ id: number; name: string; region: string }> = [];
  if (profile?.profile?.countiesOfOperation) {
    const countyIds = profile.profile.countiesOfOperation as number[];
    if (countyIds.length > 0) {
      profileCounties = await db
        .select()
        .from(counties)
        .where(
          eq(
            counties.id,
            countyIds[0] // This is a simplification; ideally use IN clause
          )
        );
      // Fetch all counties properly
      profileCounties = await db
        .select()
        .from(counties)
        .then((all) => all.filter((c) => countyIds.includes(c.id)));
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="border-l-4 border-kenya-green pl-4">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Profile Settings
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Manage your account information and preferences
            </p>
          </div>
        </div>

        <ProfileView
          user={user}
          profile={profile?.profile || null}
          sector={profile?.sector || null}
          agency={profile?.agency || null}
          counties={profileCounties}
        />
      </main>
    </div>
  );
}
