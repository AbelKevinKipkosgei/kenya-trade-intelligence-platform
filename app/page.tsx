import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  tradeTransactions,
  countries,
  exporters,
  tradeBarriers,
  ports,
} from "@/db/schema";

export const revalidate = 3600;

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

async function loadStats() {
  const [{ latestYear, latestDate }] = await db
    .select({
      latestYear: sql<number>`extract(year from max(${tradeTransactions.transactionDate}))::int`,
      latestDate: sql<Date>`max(${tradeTransactions.transactionDate})`,
    })
    .from(tradeTransactions);

  const [
    flowTotals,
    topPartnerRows,
    exporterCountRows,
    activeBarrierRows,
    portCountRows,
  ] = await Promise.all([
    db
      .select({
        flowType: tradeTransactions.flowType,
        total: sql<string>`sum(${tradeTransactions.valueUsd})`,
      })
      .from(tradeTransactions)
      .where(
        sql`extract(year from ${tradeTransactions.transactionDate}) = ${latestYear}`,
      )
      .groupBy(tradeTransactions.flowType),
    db
      .select({
        countryName: countries.name,
        total: sql<string>`sum(${tradeTransactions.valueUsd})`,
      })
      .from(tradeTransactions)
      .innerJoin(countries, eq(countries.id, tradeTransactions.countryId))
      .where(
        and(
          eq(tradeTransactions.flowType, "export"),
          sql`extract(year from ${tradeTransactions.transactionDate}) = ${latestYear}`,
        ),
      )
      .groupBy(countries.name)
      .orderBy(sql`sum(${tradeTransactions.valueUsd}) desc`)
      .limit(1),
    db.select({ count: sql<string>`count(*)` }).from(exporters),
    db
      .select({ count: sql<string>`count(*)` })
      .from(tradeBarriers)
      .where(eq(tradeBarriers.status, "active")),
    db.select({ count: sql<string>`count(*)` }).from(ports),
  ]);

  const exportTotal = Number(
    flowTotals.find((f) => f.flowType === "export")?.total ?? 0,
  );
  const importTotal = Number(
    flowTotals.find((f) => f.flowType === "import")?.total ?? 0,
  );

  return {
    latestYear,
    latestDate,
    exportTotal,
    importTotal,
    topPartner: topPartnerRows[0]?.countryName ?? "—",
    exporterCount: Number(exporterCountRows[0].count),
    activeBarriers: Number(activeBarrierRows[0].count),
    portCount: Number(portCountRows[0].count),
  };
}

const FEATURES = [
  {
    title: "Market & Product Explorer",
    href: "/explorer",
    description:
      "Search HS-coded products and trace tariffs, top markets, and trade history for any Kenyan export line.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    ),
  },
  {
    title: "Market Opportunity Leaderboard",
    href: "/opportunities",
    description:
      "Rank product-market combinations by demand, growth, competitiveness, and market access to find where to expand next.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    ),
  },
  {
    title: "Trade Barrier Monitor",
    href: "/barriers",
    description:
      "Track non-tariff barriers, SPS/technical requirements, and licensing issues reported by Kenyan trade agencies.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    ),
  },
  {
    title: "Export Capacity Directory",
    href: "/exporters",
    description:
      "Browse registered Kenyan exporters by sector, county, and production capacity to assess national supply readiness.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
      />
    ),
  },
  {
    title: "Trade News",
    href: "/news",
    description:
      "Live Kenya trade, tariff, and logistics news, ingested continuously and categorized automatically.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
      />
    ),
  },
  {
    title: "Getting Started Guide",
    href: "/getting-started",
    description:
      "Step-by-step export procedures and required agency approvals, for first-time and experienced exporters alike.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    title: "AI Trade Analyst",
    href: "/analyst",
    description:
      "Ask natural-language questions and get answers grounded directly in the platform's live trade data.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      />
    ),
  },
];

export default async function Home() {
  const stats = await loadStats();
  const dataAsOf = stats.latestDate
    ? new Intl.DateTimeFormat("en-GB", {
        month: "long",
        year: "numeric",
      }).format(new Date(stats.latestDate))
    : "latest available";

  const statCards = [
    {
      label: "Total export value",
      value: usdCompact.format(stats.exportTotal),
    },
    {
      label: "Total import value",
      value: usdCompact.format(stats.importTotal),
    },
    { label: "Top export partner", value: stats.topPartner },
    {
      label: "Active trade barriers",
      value: `${stats.activeBarriers.toLocaleString()} Active`,
    },
  ];

  return (
    <div className="flex min-h-full flex-1 flex-col bg-white dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 sm:px-10">
        <section className="grid gap-10 border-b border-zinc-200 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 dark:border-zinc-800">
          <div className="flex flex-col items-start gap-6">
            <div className="border-l-4 border-kenya-red pl-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              State Department for Trade
              <span className="mt-1 block text-xs font-normal text-zinc-500 dark:text-zinc-400">
                Republic of Kenya
              </span>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-zinc-950 dark:text-white sm:text-6xl">
              Kenya&apos;s trade intelligence, grounded in evidence.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
              A public data platform for understanding export performance,
              market access, trade barriers, and opportunities across
              Kenya&apos;s trading relationships.
            </p>
            <div className="flex flex-col items-start gap-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="/analyst"
                  className="flex h-12 items-center justify-center border border-kenya-green bg-kenya-green px-6 text-sm font-semibold text-white transition-colors hover:bg-[#004d00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kenya-red"
                >
                  Ask the AI Trade Analyst
                </a>
                <a
                  href="/explorer"
                  className="flex h-12 items-center justify-center border border-zinc-400 px-6 text-sm font-semibold text-zinc-900 transition-colors hover:border-zinc-900 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kenya-red dark:border-zinc-600 dark:text-zinc-100 dark:hover:border-zinc-300 dark:hover:bg-zinc-900"
                >
                  Explore Products &amp; Markets
                </a>
              </div>
              <a
                href="/getting-started"
                className="text-sm text-zinc-600 underline decoration-zinc-400 underline-offset-4 transition-colors hover:text-zinc-900 hover:decoration-zinc-600 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-zinc-200 dark:hover:decoration-zinc-400"
              >
                New here? See the Getting Started guide →
              </a>
            </div>
          </div>
          <aside className="self-end border-t-4 border-kenya-black bg-zinc-50 p-6 dark:bg-zinc-900">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-kenya-green">
              Platform coverage
            </p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              {stats.exporterCount.toLocaleString()}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              registered exporters
            </p>
            <div className="my-5 border-t border-zinc-200 dark:border-zinc-700" />
            <p className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              {stats.portCount}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              trade gateways monitored
            </p>
            <p className="mt-5 text-xs text-zinc-500 dark:text-zinc-400">
              Data updated {dataAsOf}
            </p>
          </aside>
        </section>

        <section
          id="overview"
          className="grid grid-cols-1 gap-0 border-b border-zinc-200 py-10 dark:border-zinc-800 sm:grid-cols-2 lg:grid-cols-4"
        >
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="min-w-0 border-l border-zinc-200 px-5 py-4 first:border-l-0 dark:border-zinc-800"
            >
              <div className="block wrap-break-word text-2xl font-semibold leading-tight tracking-tight text-zinc-950 dark:text-zinc-50">
                {stat.value}
              </div>
              <div className="mt-2 block max-w-60 text-xs font-semibold uppercase leading-snug tracking-wide text-zinc-700 dark:text-zinc-300">
                {stat.label}
              </div>
              <div className="mt-2 block text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                Data as of {dataAsOf}
              </div>
            </div>
          ))}
        </section>

        <section id="features" className="py-16">
          <div className="mb-8 flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-kenya-green">
              Explore the platform
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Tools for the full trade workflow
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Start with the core intelligence workflow, then move into the
              operational tools that support decisions and action.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {FEATURES.slice(0, 3).map((feature) => (
              <a
                key={feature.title}
                href={feature.href}
                className="flex min-h-64 flex-col gap-5 border-t-4 border-zinc-300 bg-zinc-50 p-6 transition-colors hover:border-kenya-green hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kenya-red dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <span className="flex h-10 w-10 items-center justify-center border border-kenya-green/30 text-kenya-green dark:border-kenya-green/50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    {feature.icon}
                  </svg>
                </span>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </a>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {FEATURES.slice(3, 6).map((feature) => (
              <a
                key={feature.title}
                href={feature.href}
                className="flex min-h-44 flex-col gap-4 border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-500 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kenya-red dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
              >
                <span className="flex h-9 w-9 items-center justify-center border border-zinc-300 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    {feature.icon}
                  </svg>
                </span>
                <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </a>
            ))}
          </div>

          {(() => {
            const analyst = FEATURES[6];
            return (
              <a
                href={analyst.href}
                className="mt-10 grid gap-6 border-l-4 border-kenya-red bg-zinc-950 p-6 text-white transition-colors hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kenya-red sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-8"
              >
                <span className="flex h-12 w-12 items-center justify-center border border-white/40 text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    {analyst.icon}
                  </svg>
                </span>
                <span>
                  <span className="block text-xs font-bold uppercase tracking-[0.12em] text-[#91c98f]">
                    AI Trade Analyst
                  </span>
                  <span className="mt-2 block text-lg font-semibold">
                    Ask a question. Get a data-grounded answer.
                  </span>
                  <span className="mt-2 block text-sm text-zinc-300">
                    “Which markets show the strongest opportunity for Kenyan
                    avocado exports?”
                  </span>
                </span>
                <span className="text-sm font-semibold text-white">
                  Open analyst &rarr;
                </span>
              </a>
            );
          })()}
        </section>
      </main>
    </div>
  );
}
