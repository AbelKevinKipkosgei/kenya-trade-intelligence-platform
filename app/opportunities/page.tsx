import { eq, and, desc, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import {
  marketOpportunityScores,
  products,
  sectors,
  countries,
} from "@/db/schema";
import { LeaderboardFilters } from "@/components/leaderboard-filters";
import { AddToWatchlist } from "@/components/watchlist/add-to-watchlist";

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
  searchParams: Promise<{
    sector?: string;
    country?: string;
    period?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const productSearch = params.search?.trim() ?? "";
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
  if (productSearch) {
    const terms = productSearch.split(/\s+/).filter(Boolean);
    conditions.push(
      and(
        ...terms.map((term) =>
          or(
            ilike(products.description, `%${term}%`),
            ilike(products.hsCode, `%${term}%`),
          ),
        ),
      )!,
    );
  }

  const rows = await db
    .select({
      id: marketOpportunityScores.id,
      hsCode: products.hsCode,
      productId: products.id,
      productDescription: products.description,
      sectorName: sectors.name,
      countryId: marketOpportunityScores.countryId,
      countryName: countries.name,
      countryIso2: countries.iso2,
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
    <main className="flex min-h-full flex-1 flex-col bg-white dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-7 sm:px-8 sm:py-9">
        <div className="mb-5 flex items-start gap-3 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-kenya-green/10 text-kenya-green">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M12 3v4m0 10v4M3 12h4m10 0h4M5.64 5.64l2.83 2.83m7.06 7.06 2.83 2.83m0-12.72-2.83 2.83m-7.06 7.06-2.83 2.83" />
              <circle cx="12" cy="12" r="4.2" />
              <path d="m12 10 1.2 2-1.2 2-1.2-2 1.2-2Z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-semibold leading-none tracking-tight text-ktp-navy dark:text-zinc-50 sm:text-4xl">
              Market Opportunity Leaderboard
            </h1>
            <p className="mt-2 max-w-4xl text-xs leading-5 text-slate-500 dark:text-zinc-400 sm:text-sm">
              Rankings product-market combinations by opportunity score: demand,
              growth, competitiveness, market access, competition, logistics,
              and domestic capacity.
            </p>
          </div>
        </div>
        <p className="mb-5 max-w-5xl text-[11px] leading-4 text-slate-500 dark:text-zinc-500">
          Computed from real trade transactions, tariffs, trade barriers, and
          registered exporter capacity. Competitiveness and competition are
          proxies (Kenya has no third-country trade data to benchmark against
          rival exporters), and logistics uses regional-bloc membership as a
          stand-in for real freight/transit data - see the AI Trade Analyst for
          the full methodology on any figure.
        </p>

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
          productSearch={productSearch}
        />

        {top && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-[#f1fbf7] px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/30 sm:px-5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M12 3v18M5 8a7 7 0 0 1 14 0c0 3.5-2.7 5.4-7 7-4.3-1.6-7-3.5-7-7Z" />
                <path d="M8 12c1.2 1.1 2.5 1.7 4 2 1.5-.3 2.8-.9 4-2" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                Top opportunity this period
              </p>
              <p className="mt-1 truncate text-xs text-slate-600 dark:text-zinc-300 sm:text-sm">
                <a
                  href={`/explorer?hs=${top.hsCode}`}
                  className="font-semibold text-slate-700 hover:text-kenya-green hover:underline dark:text-zinc-100"
                >
                  {top.productDescription}
                </a>{" "}
                <span>
                  in <span className="font-semibold">{top.countryName}</span>
                </span>
              </p>
            </div>
            <div className="hidden border-l border-emerald-200 pl-5 text-right dark:border-emerald-900 sm:block">
              <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                Overall score
              </p>
              <p className="text-xl font-bold leading-none text-emerald-700 dark:text-emerald-300">
                {Number(top.overallScore).toFixed(1)}
              </p>
            </div>
          </div>
        )}

        {rows.length === 0 ? (
          <p className="mt-5 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No opportunity scores match these filters.
          </p>
        ) : (
          <>
            {/* Card list below sm: an 8-column table doesn't fit a phone
              screen even with horizontal scroll, so mobile gets a
              stacked, scannable layout instead of the desktop table. */}
            <div className="mt-5 flex flex-col gap-3 sm:hidden">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,42,67,0.04)] dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <a
                        href={`/explorer?hs=${r.hsCode}`}
                        className="text-sm font-semibold text-kenya-green hover:underline line-clamp-2"
                      >
                        {r.productDescription}
                      </a>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {r.sectorName} · {r.countryName}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-start gap-2">
                      <div className="text-right">
                        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                          {Number(r.overallScore).toFixed(1)}
                        </span>
                        <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                          Overall
                        </p>
                      </div>
                      <AddToWatchlist
                        itemType="opportunity"
                        itemId={r.id}
                        itemName={`${r.productDescription} in ${r.countryName}`}
                        itemMeta={{
                          hsCode: r.hsCode,
                          productId: r.productId,
                          countryId: r.countryId,
                          sector: r.sectorName,
                          score: Number(r.overallScore).toFixed(1),
                        }}
                        variant="icon"
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 border-t border-stone-200 pt-3 text-center dark:border-zinc-800">
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {Number(r.demandScore).toFixed(0)}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Demand
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {Number(r.growthScore).toFixed(0)}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Growth
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {Number(r.competitivenessScore).toFixed(0)}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Competitive
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {Number(r.marketAccessScore).toFixed(0)}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Access
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table from sm up, where 8 columns comfortably fit. */}
            <div className="mt-5 hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(16,42,67,0.05)] dark:border-zinc-700 dark:bg-zinc-900 sm:block">
              <table className="w-full min-w-235 text-left text-xs">
                <thead className="bg-[#f7fafb] text-[10px] uppercase tracking-wide text-slate-500 dark:bg-zinc-950 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-3 py-3 font-semibold">Sector</th>
                    <th className="px-3 py-3 font-semibold">Market</th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Overall score
                    </th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Demand
                    </th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Growth
                    </th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Competitiveness
                    </th>
                    <th className="px-3 py-3 text-right font-semibold">
                      Market Access
                    </th>
                    <th className="px-3 py-3 text-center font-semibold">
                      Watch
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-100 transition-colors hover:bg-[#f8fcfb] dark:border-zinc-800 dark:hover:bg-zinc-800/60"
                    >
                      <td className="max-w-70 px-4 py-3">
                        <a
                          href={`/explorer?hs=${r.hsCode}`}
                          className="block truncate font-semibold text-slate-700 hover:text-kenya-green hover:underline dark:text-zinc-100"
                        >
                          {r.productDescription}
                        </a>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          HS Code: {r.hsCode}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                          {r.sectorName}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600 dark:text-zinc-300">
                        <CountryFlag
                          iso2={r.countryIso2}
                          countryName={r.countryName}
                        />
                        {r.countryName}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-emerald-700 dark:text-emerald-300">
                        {Number(r.overallScore).toFixed(1)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-500 dark:text-zinc-400">
                        {Number(r.demandScore).toFixed(0)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-500 dark:text-zinc-400">
                        {Number(r.growthScore).toFixed(0)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-500 dark:text-zinc-400">
                        {Number(r.competitivenessScore).toFixed(0)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-500 dark:text-zinc-400">
                        {Number(r.marketAccessScore).toFixed(0)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <AddToWatchlist
                          itemType="opportunity"
                          itemId={r.id}
                          itemName={`${r.productDescription} in ${r.countryName}`}
                          itemMeta={{
                            hsCode: r.hsCode,
                            productId: r.productId,
                            countryId: r.countryId,
                            sector: r.sectorName,
                            score: Number(r.overallScore).toFixed(1),
                          }}
                          variant="icon"
                          size="sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function CountryFlag({
  iso2,
  countryName,
}: {
  iso2: string;
  countryName: string;
}) {
  return (
    <img
      src={`https://flagcdn.com/w80/${iso2.toLowerCase()}.png`}
      alt={`${countryName} flag`}
      width={80}
      height={56}
      loading="lazy"
      className="mr-2 inline-block h-3.5 w-5 rounded-sm object-cover align-[-2px] shadow-[0_0_0_1px_rgba(15,23,42,0.08)]"
    />
  );
}
