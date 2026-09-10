import { redirect, notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db/client";
import { watchlists, watchlistItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { WatchlistItemsView } from "@/components/watchlist/watchlist-items-view";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Individual watchlist view page.
 * Shows all items in a specific watchlist grouped by type.
 */
export default async function WatchlistDetailPage({ params }: PageProps) {
  const session = await requireAuth();
  const userId = parseInt(session.user.id);
  const { id } = await params;
  const watchlistId = parseInt(id);

  if (isNaN(watchlistId)) {
    notFound();
  }

  // Fetch watchlist and verify ownership
  const [watchlist] = await db
    .select()
    .from(watchlists)
    .where(and(eq(watchlists.id, watchlistId), eq(watchlists.userId, userId)))
    .limit(1);

  if (!watchlist) {
    notFound();
  }

  // Fetch all items in this watchlist
  const items = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.watchlistId, watchlistId))
    .orderBy(watchlistItems.addedAt);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="border-l-4 border-kenya-green pl-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                {watchlist.name}
              </h1>
              {watchlist.isDefault && (
                <span className="rounded bg-kenya-green/10 px-3 py-1 text-sm font-medium text-kenya-green">
                  Default
                </span>
              )}
            </div>
            {watchlist.description && (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {watchlist.description}
              </p>
            )}
          </div>
        </div>

        <WatchlistItemsView
          watchlistId={watchlistId}
          watchlistName={watchlist.name}
          initialItems={items}
        />
      </main>
    </div>
  );
}
