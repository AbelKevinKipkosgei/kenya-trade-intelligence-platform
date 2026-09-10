"use client";

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
  const cards = [
    {
      label: "Watchlists",
      value: stats.totalWatchlists,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      ),
      color: "bg-kenya-green/10 text-kenya-green",
      href: "/watchlists",
    },
    {
      label: "Tracked Items",
      value: stats.totalItems,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
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
      ),
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      href: "/watchlists",
    },
    {
      label: "Products",
      value: stats.productCount,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      href: "/explorer",
    },
    {
      label: "Opportunities",
      value: stats.opportunityCount,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      href: "/opportunities",
    },
    {
      label: "Barriers",
      value: stats.barrierCount,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      color: "bg-red-500/10 text-red-600 dark:text-red-400",
      href: "/barriers",
    },
    {
      label: "Exporters",
      value: stats.exporterCount,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      color: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
      href: "/exporters",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <a
          key={card.label}
          href={card.href}
          className="border-t-4 border-zinc-300 bg-white p-6 transition-all hover:border-kenya-green hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">
                {card.value}
              </p>
            </div>
            <div className={`rounded-lg p-3 ${card.color}`}>{card.icon}</div>
          </div>
        </a>
      ))}
    </div>
  );
}
