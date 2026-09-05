import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import {
  marketOpportunityScores,
  products,
  sectors,
  countries,
} from "@/db/schema";
import { LeaderboardFilters } from "@/components/leaderboard-filters";

export const revalidate = 3600;

async function loadPeriods() {
  const rows = await db
    .select({
      period: sql<string>`to_char(${marketOpportunityScores.period}, 'YYYY-MM-DD')`,
    })
    .from(marketOpportunityScores)
    .groupBy(marketOpportunityScores.period)
    .orderBy(desc(marketOpportunityScores.period))
    .limit(12);
  return rows.map((r) => r.period);
}

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-").map(Number);
  const quarter = Math.floor((month - 1) / 3) + 1;
  return `Q${quarter} ${year}`;
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string; country?: string; period?: string }>;
}) {
  const params = await searchParams;
  const periods = await loadPeriods();
  const selectedPeriod =
    params.period && periods.includes(params.period)
      ? params.period
      : periods[0];

  const [sectorOptions, countryOptions] = await Promise.all([
    db
      .select({ value: sql<string>`${sectors.id}::text`, label: sectors.name })
      .from(sectors)
      .orderBy(sectors.name),
    db
      .select({
        value: sql<string>`${countries.id}::text`,
        label: countries.name,
      })
      .from(countries)
      .orderBy(countries.name),
  ]);

  const conditions: SQL[] = [
    sql`to_char(${marketOpportunityScores.period}, 'YYYY-MM-DD') = ${selectedPeriod}`,
  ];
  if (params.sector)
    conditions.push(eq(products.sectorId, Number(params.sector)));
  if (params.country)
    conditions.push(
      eq(marketOpportunityScores.countryId, Number(params.country)),
    );

  const rows = await db
    .select({
      id: marketOpportunityScores.id,
      hsCode: products.hsCode,
      productDescription: products.description,
      sectorName: sectors.name,
      countryName: countries.name,
      overallScore: marketOpportunityScores.overallScore,
      demandScore: marketOpportunityScores.demandScore,
      growthScore: marketOpportunityScores.growthScore,
      competitivenessScore: marketOpportunityScores.competitivenessScore,
      marketAccessScore: marketOpportunityScores.marketAccessScore,
    })
    .from(marketOpportunityScores)
    .innerJoin(products, eq(products.id, marketOpportunityScores.productId))
    .innerJoin(sectors, eq(sectors.id, products.sectorId))
    .innerJoin(countries, eq(countries.id, marketOpportunityScores.countryId))
    .where(and(...conditions))
    .orderBy(desc(marketOpportunityScores.overallScore))
    .limit(50);

  const top = rows[0];

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-1 flex-col px-6 py-10 sm:px-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Market Opportunity Leaderboard
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Ranks product–market combinations by opportunity score (demand,
          growth, competitiveness, market access, competition, logistics,
          domestic capacity).
        </p>
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-500">
          Computed from real trade transactions, tariffs, trade barriers, and
          registered exporter capacity. Competitiveness and competition are
          proxies (Kenya has no third-country trade data to benchmark against
          rival exporters), and logistics uses regional-bloc membership as a
          stand-in for real freight/transit data - see the AI Trade Analyst for
          the full methodology on any figure.
        </p>
      </div>

      <LeaderboardFilters
        sectors={sectorOptions}
        countries={countryOptions}
        periods={periods.map((p) => ({
          value: p,
          label: formatPeriodLabel(p),
        }))}
        selectedSector={params.sector ?? ""}
        selectedCountry={params.country ?? ""}
        selectedPeriod={selectedPeriod}
      />

      {top && (
        <div className="mt-6 rounded-2xl border border-kenya-green/40 bg-kenya-green/5 p-5 dark:bg-kenya-green/10">
          <span className="text-xs font-semibold uppercase tracking-wide text-kenya-green">
            Top opportunity this period
          </span>
          <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
            <a
              href={`/explorer?hs=${top.hsCode}`}
              className="font-semibold hover:underline"
            >
              {top.productDescription}
            </a>{" "}
            in <span className="font-semibold">{top.countryName}</span> –
            overall score{" "}
            <span className="font-semibold">
              {Number(top.overallScore).toFixed(1)}
            </span>
          </p>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-stone-300 bg-white/70 p-5 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-400">
          No opportunity scores match these filters.
        </p>
      ) : (
        <>
          {/* Card list below sm: an 8-column table doesn't fit a phone
              screen even with horizontal scroll, so mobile gets a
              stacked, scannable layout instead of the desktop table. */}
          <div className="mt-6 flex flex-col gap-3 sm:hidden">
            {rows.map((r) => (
              <a
                key={r.id}
                href={`/explorer?hs=${r.hsCode}`}
                className="rounded-2xl border border-stone-300 bg-white/70 p-4 dark:border-zinc-700 dark:bg-zinc-800/70"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-kenya-green">{r.productDescription}</p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {r.sectorName} · {r.countryName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {Number(r.overallScore).toFixed(1)}
                    </span>
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Overall
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 border-t border-stone-200 pt-3 text-center dark:border-zinc-800">
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {Number(r.demandScore).toFixed(0)}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Demand</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {Number(r.growthScore).toFixed(0)}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Growth</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {Number(r.competitivenessScore).toFixed(0)}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Competitive</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {Number(r.marketAccessScore).toFixed(0)}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Access</p>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Table from sm up, where 8 columns comfortably fit. */}
          <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-stone-300 dark:border-zinc-700 sm:block">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                <tr>
                  <th className="px-3 py-2 font-semibold">Product</th>
                  <th className="px-3 py-2 font-semibold">Sector</th>
                  <th className="px-3 py-2 font-semibold">Market</th>
                  <th className="px-3 py-2 text-right font-semibold">Overall</th>
                  <th className="px-3 py-2 text-right font-semibold">Demand</th>
                  <th className="px-3 py-2 text-right font-semibold">Growth</th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Competitiveness
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Market Access
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-stone-200 dark:border-zinc-800"
                  >
                    <td className="px-3 py-2">
                      <a
                        href={`/explorer?hs=${r.hsCode}`}
                        className="text-kenya-green hover:underline"
                      >
                        {r.productDescription}
                      </a>
                    </td>
                    <td className="px-3 py-2 text-zinc-500 dark:text-zinc-400">
                      {r.sectorName}
                    </td>
                    <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                      {r.countryName}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-zinc-900 dark:text-zinc-50">
                      {Number(r.overallScore).toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-right text-zinc-500 dark:text-zinc-400">
                      {Number(r.demandScore).toFixed(0)}
                    </td>
                    <td className="px-3 py-2 text-right text-zinc-500 dark:text-zinc-400">
                      {Number(r.growthScore).toFixed(0)}
                    </td>
                    <td className="px-3 py-2 text-right text-zinc-500 dark:text-zinc-400">
                      {Number(r.competitivenessScore).toFixed(0)}
                    </td>
                    <td className="px-3 py-2 text-right text-zinc-500 dark:text-zinc-400">
                      {Number(r.marketAccessScore).toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
