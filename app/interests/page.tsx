import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/client";
import { sectors, countries, userInterests } from "@/db/schema";
import { InterestsPicker } from "@/components/interests-picker";

export default async function InterestsPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center sm:px-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          My Interests
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Sign in to follow sectors and markets and get notified when something relevant changes.
        </p>
      </div>
    );
  }

  const [sectorOptions, countryOptions, currentInterests] = await Promise.all([
    db.select({ id: sectors.id, name: sectors.name }).from(sectors).orderBy(sectors.name),
    db.select({ id: countries.id, name: countries.name }).from(countries).orderBy(countries.name),
    db
      .select({ id: userInterests.id, sectorId: userInterests.sectorId, countryId: userInterests.countryId })
      .from(userInterests)
      .where(eq(userInterests.clerkUserId, userId)),
  ]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col px-6 py-10 sm:px-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        My Interests
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Follow sectors and markets to get notified by email when a new trade barrier or news
        article affects one of them.
      </p>

      <InterestsPicker sectors={sectorOptions} countries={countryOptions} initialInterests={currentInterests} />
    </div>
  );
}
