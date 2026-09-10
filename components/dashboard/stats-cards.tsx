"use client";

import Link from "next/link";

interface StatsCardsProps {
  stats: {
    totalWatchlists: number;
    totalItems: number;
    productCount: number;
    opportunityCount: number;
    barrierCount: number;
    exporterCount: number;
    countryCount: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-0 border-b border-zinc-200 pb-10 dark:border-zinc-800 lg:grid-cols-4">
      {/* Primary stat: Tracked Items - most actionable for returning users */}
      <Link
        href="/watchlists"
        className="group border-r border-zinc-200 pr-6 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50 sm:pr-8"
      >
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-kenya-green">
          Tracked Items
        </p>
        <p className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
          {stats.totalItems}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          across {stats.totalWatchlists} {stats.totalWatchlists === 1 ? 'watchlist' : 'watchlists'}
        </p>
      </Link>

      {/* Secondary stat: Active Barriers - actionable alert */}
      <Link
        href="/barriers"
        className="group border-r border-zinc-200 pl-6 pr-6 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50 sm:px-8"
      >
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-kenya-red">
          Active Barriers
        </p>
        <p className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
          {stats.barrierCount}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          affecting tracked items
        </p>
      </Link>

      {/* Tertiary stat: Opportunities */}
      <Link
        href="/opportunities"
        className="group border-r border-zinc-200 pl-6 pr-6 pt-6 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50 sm:px-8 lg:pt-0"
      >
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-400">
          Opportunities
        </p>
        <p className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
          {stats.opportunityCount}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          tracked markets
        </p>
      </Link>

      {/* Tertiary stat: Products */}
      <Link
        href="/explorer"
        className="group pl-6 pt-6 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50 sm:pl-8 lg:pt-0"
      >
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-400">
          Products
        </p>
        <p className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
          {stats.productCount}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          in watchlists
        </p>
      </Link>
    </section>
  );
}
