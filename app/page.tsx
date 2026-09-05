import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { tradeTransactions, countries, exporters, tradeBarriers, ports } from "@/db/schema";

export const revalidate = 3600;

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

async function loadStats() {
  const [{ latestYear }] = await db
    .select({
      latestYear: sql<number>`extract(year from max(${tradeTransactions.transactionDate}))::int`,
    })
    .from(tradeTransactions);

  const [flowTotals, topPartnerRows, exporterCountRows, activeBarrierRows, portCountRows] =
    await Promise.all([
      db
        .select({
          flowType: tradeTransactions.flowType,
          total: sql<string>`sum(${tradeTransactions.valueUsd})`,
        })
        .from(tradeTransactions)
        .where(sql`extract(year from ${tradeTransactions.transactionDate}) = ${latestYear}`)
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

  const exportTotal = Number(flowTotals.find((f) => f.flowType === "export")?.total ?? 0);
  const importTotal = Number(flowTotals.find((f) => f.flowType === "import")?.total ?? 0);

  return {
    latestYear,
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

  const statCards = [
    {
      label: `Total Export Value (${stats.latestYear})`,
      value: usdCompact.format(stats.exportTotal),
    },
    {
      label: `Total Import Value (${stats.latestYear})`,
      value: usdCompact.format(stats.importTotal),
    },
    { label: "Top Export Partner", value: stats.topPartner },
    { label: "Active Trade Barriers", value: String(stats.activeBarriers) },
  ];

  return (
    <div className="flex min-h-full flex-1 flex-col bg-linear-to-b from-[#ece6d8] to-stone-200 dark:from-[#1c1c1e] dark:to-zinc-900">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 sm:px-10">
        <section className="flex flex-col items-start gap-6 py-20 sm:py-28">
          <span className="rounded-full bg-kenya-green/10 px-3 py-1 text-xs font-semibold text-kenya-green dark:bg-kenya-green/20">
            {stats.exporterCount.toLocaleString()} exporters · {stats.portCount} trade gateways
            monitored
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
            Understand Kenya&apos;s trade flows, in real time.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            A unified view of exports, imports, tariffs, market opportunities, trade barriers, and
            export capacity – built for policymakers, exporters, and analysts who need answers
            fast.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/explorer"
              className="flex h-12 items-center justify-center rounded-full bg-kenya-green px-6 text-sm font-semibold text-white transition-colors hover:bg-kenya-green/90"
            >
              Explore Products &amp; Markets
            </a>
            <a
              href="/analyst"
              className="flex h-12 items-center justify-center rounded-full border border-stone-400 px-6 text-sm font-semibold text-zinc-800 transition-colors hover:bg-stone-200 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Ask the AI Trade Analyst
            </a>
          </div>
        </section>

        <section
          id="overview"
          className="grid grid-cols-2 gap-4 border-t border-stone-400 py-12 dark:border-zinc-700 sm:grid-cols-4"
        >
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-1 rounded-2xl border border-stone-300 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {stat.value}
              </span>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {stat.label}
              </span>
            </div>
          ))}
        </section>

        <section id="features" className="py-16">
          <div className="mb-8 flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Everything in one platform
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Seven tools covering the full trade intelligence workflow, from spotting an
              opportunity to acting on it.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <a
                key={feature.title}
                href={feature.href}
                className="flex flex-col gap-4 rounded-2xl border border-stone-300 bg-white/60 p-6 transition hover:border-kenya-green/60 hover:bg-white dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:bg-zinc-800"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-kenya-green/10 text-kenya-green dark:bg-kenya-green/20">
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
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 border-t border-stone-400 px-6 py-8 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-500 sm:flex-row sm:px-10">
        <span>© 2026 Kenya Trade Intelligence Platform</span>
        <span>Built for data-driven trade policy</span>
      </footer>
    </div>
  );
}
