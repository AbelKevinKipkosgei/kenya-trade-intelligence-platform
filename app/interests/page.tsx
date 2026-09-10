import { and, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { sectors, countries, watchlists, watchlistItems } from "@/db/schema";
import { InterestsPicker } from "@/components/interests-picker";

export default async function InterestsPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center sm:px-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          My Interests
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Sign in to follow sectors and markets and get notified when something relevant changes.
        </p>
        <Link
          href="/auth/signin"
          className="mt-2 flex h-12 items-center justify-center border border-kenya-green bg-kenya-green px-6 text-sm font-semibold text-white transition-colors hover:bg-[#004d00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kenya-red"
        >
          Sign in to continue
        </Link>
      </div>
    );
  }

  const userId = Number(session.user.id);
  const [sectorOptions, countryOptions, followedItems] = await Promise.all([
    db.select({ id: sectors.id, name: sectors.name }).from(sectors).orderBy(sectors.name),
    db.select({ id: countries.id, name: countries.name }).from(countries).orderBy(countries.name),
    db
      .select({
        id: watchlistItems.id,
        itemType: watchlistItems.itemType,
        itemId: watchlistItems.itemId,
      })
      .from(watchlistItems)
      .innerJoin(watchlists, eq(watchlists.id, watchlistItems.watchlistId))
      .where(
        and(
          eq(watchlists.userId, userId),
          inArray(watchlistItems.itemType, ["sector", "country"])
        )
      ),
  ]);

  const currentInterests = followedItems.map((item) => ({
    id: item.id,
    sectorId: item.itemType === "sector" ? item.itemId : null,
    countryId: item.itemType === "country" ? item.itemId : null,
  }));

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col px-6 py-10 sm:px-10">
      <Link
        href="/watchlists"
        className="inline-flex items-center gap-2 text-sm font-medium text-kenya-green hover:text-[#004d00]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Watchlists
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        My Interests
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Follow sectors and markets to get notified by email when a new trade barrier or news
        article affects one of them. Follows here are saved to your &ldquo;My
        Interests&rdquo; watchlist, alongside your other tracked items.
      </p>

      <InterestsPicker sectors={sectorOptions} countries={countryOptions} initialInterests={currentInterests} />
    </div>
  );
}
