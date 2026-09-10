"use client";

import Link from "next/link";

interface Watchlist {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean;
  itemCount: number;
}

interface WatchlistPreviewProps {
  watchlists: Watchlist[];
}

export function WatchlistPreview({ watchlists }: WatchlistPreviewProps) {
  return (
    <section className="border-t-4 border-kenya-black bg-zinc-50 p-6 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
          Your Watchlists
        </h2>
        <Link
          href="/watchlists"
          className="text-sm font-medium text-kenya-green transition-colors hover:text-[#004d00]"
        >
          View all →
        </Link>
      </div>

      {watchlists.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            No watchlists yet
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Create your first watchlist to track items
          </p>
          <Link
            href="/watchlists"
            className="mt-4 inline-block border border-kenya-green bg-kenya-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#004d00]"
          >
            Create Watchlist
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {watchlists.map((watchlist) => (
            <Link
              key={watchlist.id}
              href={`/watchlists/${watchlist.id}`}
              className="block border-l-4 border-zinc-300 bg-white p-4 transition-colors hover:border-kenya-green hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-950 dark:text-white truncate">
                      {watchlist.name}
                    </h3>
                    {watchlist.isDefault && (
                      <span className="shrink-0 bg-kenya-green/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-kenya-green">
                        Default
                      </span>
                    )}
                  </div>
                  {watchlist.description && (
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {watchlist.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {watchlist.itemCount} {watchlist.itemCount === 1 ? 'item' : 'items'}
              </div>
            </Link>
          ))}

          {watchlists.length >= 3 && (
            <Link
              href="/watchlists"
              className="block border border-zinc-300 p-3 text-center text-sm font-medium text-kenya-green transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              View all watchlists →
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
