"use client";

import Link from "next/link";

interface QuickActionsProps {
  userRole: string;
}

export function QuickActions({ userRole }: QuickActionsProps) {
  const commonActions = [
    {
      label: "Explore Products",
      description: "Search for products by HS code",
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
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      ),
      href: "/explorer",
      color: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 dark:text-purple-400",
    },
    {
      label: "View Opportunities",
      description: "Discover market opportunities",
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
      href: "/opportunities",
      color: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400",
    },
    {
      label: "Check Barriers",
      description: "View active trade barriers",
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
      href: "/barriers",
      color: "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400",
    },
  ];

  const exporterActions = [
    {
      label: "Find Exporters",
      description: "Connect with other exporters",
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
      href: "/exporters",
      color: "bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 dark:text-teal-400",
    },
    {
      label: "AI Trade Analyst",
      description: "Get personalized insights",
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
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      href: "/analyst",
      color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400",
    },
  ];

  const officerActions = [
    {
      label: "View Dashboards",
      description: "Access analytics dashboards",
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      href: "/dashboards",
      color: "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-400",
    },
    {
      label: "Exporter Capacity",
      description: "Review registered exporters",
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
      href: "/exporters",
      color: "bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 dark:text-teal-400",
    },
  ];

  const roleSpecificActions =
    userRole === "exporter" ? exporterActions : officerActions;
  const allActions = [...commonActions, ...roleSpecificActions];

  return (
    <section className="border-t-4 border-kenya-green bg-white p-6 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-white">
        Quick Actions
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {allActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`flex items-start gap-4 rounded-lg border border-zinc-200 p-4 transition-all hover:shadow-md dark:border-zinc-700 ${action.color}`}
          >
            <div className="shrink-0">{action.icon}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">{action.label}</h3>
              <p className="mt-0.5 text-xs opacity-80">{action.description}</p>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}
