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
      href: "/explorer",
    },
    {
      label: "View Opportunities",
      description: "Discover market opportunities",
      href: "/opportunities",
    },
    {
      label: "Check Barriers",
      description: "View active trade barriers",
      href: "/barriers",
    },
  ];

  const roleSpecificActions =
    userRole === "exporter"
      ? [
          {
            label: "AI Trade Analyst",
            description: "Get personalized insights",
            href: "/analyst",
          },
        ]
      : [
          {
            label: "View Dashboards",
            description: "Access analytics dashboards",
            href: "/dashboards",
          },
        ];

  const allActions = [...commonActions, ...roleSpecificActions];

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
        Quick Actions
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {allActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group border-t-4 border-zinc-300 bg-zinc-50 p-5 transition-colors hover:border-kenya-green dark:border-zinc-700 dark:bg-zinc-900"
          >
            <h3 className="font-semibold text-zinc-950 transition-colors group-hover:text-kenya-green dark:text-white dark:group-hover:text-kenya-green">
              {action.label}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
