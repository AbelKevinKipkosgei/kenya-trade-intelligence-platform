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
    <section className="border-t-4 border-kenya-green bg-white p-6 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
          Your Watchlists
        </h2>
        <Link
          href="/watchlists"
          className="text-sm font-medium text-kenya-green hover:text-[#004d00]"
        >
          View all →
        </Link>
      </div>

      {watchlists.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-12 w-12 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
              className="block border-l-4 border-zinc-300 bg-zinc-50 p-4 transition-colors hover:border-kenya-green hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-zinc-950 dark:text-white truncate">
                      {watchlist.name}
                    </h3>
                    {watchlist.isDefault && (
                      <span className="shrink-0 rounded bg-kenya-green/10 px-2 py-0.5 text-xs font-medium text-kenya-green">
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
              <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <span>{watchlist.itemCount} items</span>
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
