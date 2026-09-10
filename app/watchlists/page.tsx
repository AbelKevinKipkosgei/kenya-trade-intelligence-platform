import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db/client";
import { watchlists, watchlistItems } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { WatchlistsView } from "@/components/watchlist/watchlists-view";

/**
 * Watchlists management page.
 * Shows all user watchlists with item counts and management options.
 */
export default async function WatchlistsPage() {
  const session = await requireAuth();
  const userId = parseInt(session.user.id);

  // Fetch all watchlists with item counts
  const userWatchlists = await db
    .select({
      id: watchlists.id,
      name: watchlists.name,
      description: watchlists.description,
      isDefault: watchlists.isDefault,
      createdAt: watchlists.createdAt,
      updatedAt: watchlists.updatedAt,
      itemCount: sql<number>`count(${watchlistItems.id})::int`,
    })
    .from(watchlists)
    .leftJoin(watchlistItems, eq(watchlists.id, watchlistItems.watchlistId))
    .where(eq(watchlists.userId, userId))
    .groupBy(watchlists.id)
    .orderBy(watchlists.createdAt);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="border-l-4 border-kenya-green pl-4">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              My Watchlists
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Track products, markets, and opportunities you're monitoring
            </p>
          </div>
        </div>

        <WatchlistsView initialWatchlists={userWatchlists} />
      </main>
    </div>
  );
}
