import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { tradeBarriers, products, sectors, countries, agencies } from "@/db/schema";
import { BarrierFilters } from "@/components/barrier-filters";
import { AddToWatchlist } from "@/components/watchlist/add-to-watchlist";

export const revalidate = 3600;

const IMPACT_STYLES: Record<string, string> = {
  high: "bg-kenya-red/10 text-kenya-red",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-500",
  low: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
};

export default async function BarriersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; sector?: string; country?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "active";
  const type = params.type ?? "";
  const sector = params.sector ?? "";
  const country = params.country ?? "";

  const [sectorOptions, countryOptions] = await Promise.all([
    db.select({ value: sql<string>`${sectors.id}::text`, label: sectors.name }).from(sectors).orderBy(sectors.name),
    db
      .select({ value: sql<string>`${countries.id}::text`, label: countries.name })
      .from(countries)
      .orderBy(countries.name),
  ]);

  const conditions: SQL[] = [];
  if (status) conditions.push(eq(tradeBarriers.status, status));
  if (type) conditions.push(eq(tradeBarriers.barrierType, type));
  if (sector) conditions.push(eq(sectors.id, Number(sector)));
  if (country) conditions.push(eq(tradeBarriers.countryId, Number(country)));
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db
      .select({
        id: tradeBarriers.id,
        countryId: tradeBarriers.countryId,
        hsCode: products.hsCode,
        productDescription: products.description,
        sectorName: sectors.name,
        countryName: countries.name,
        barrierType: tradeBarriers.barrierType,
        description: tradeBarriers.description,
        status: tradeBarriers.status,
        impactLevel: tradeBarriers.impactLevel,
        reportedDate: sql<string>`to_char(${tradeBarriers.reportedDate}, 'YYYY-MM-DD')`,
        agencyName: agencies.name,
      })
      .from(tradeBarriers)
      .leftJoin(products, eq(products.id, tradeBarriers.productId))
      .leftJoin(sectors, eq(sectors.id, products.sectorId))
      .innerJoin(countries, eq(countries.id, tradeBarriers.countryId))
      .innerJoin(agencies, eq(agencies.id, tradeBarriers.sourceAgencyId))
      .where(whereClause)
      .orderBy(desc(tradeBarriers.reportedDate))
      .limit(50),
    db
      .select({ count: sql<string>`count(*)` })
      .from(tradeBarriers)
      .leftJoin(products, eq(products.id, tradeBarriers.productId))
      .leftJoin(sectors, eq(sectors.id, products.sectorId))
      .where(whereClause),
  ]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-1 flex-col px-6 py-10 sm:px-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Trade Barrier Monitor
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Non-tariff barriers, SPS/technical requirements, quotas, and licensing issues affecting
          Kenyan exports, as reported by the responsible agency.
        </p>
      </div>

      <BarrierFilters
        sectors={sectorOptions}
        countries={countryOptions}
        selectedStatus={status}
        selectedType={type}
        selectedSector={sector}
        selectedCountry={country}
      />

      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
        Showing {rows.length} of {count} matching barriers.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {rows.length === 0 && (
          <p className="rounded-2xl border border-stone-300 bg-white/70 p-5 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-400">
            No barriers match these filters.
          </p>
        )}
        {rows.map((b) => (
          <div
            key={b.id}
            className="rounded-2xl border border-stone-300 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-800/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">{b.countryName}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${IMPACT_STYLES[b.impactLevel] ?? ""}`}>
                    {b.impactLevel} impact
                  </span>
                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                    {b.status}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {b.barrierType} · {b.agencyName} · reported {b.reportedDate}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{b.description}</p>
                {b.hsCode && (
                  <a
                    href={`/explorer?hs=${b.hsCode}`}
                    className="mt-2 inline-block text-xs font-medium text-kenya-green hover:underline"
                  >
                    {b.productDescription} ({b.sectorName}) →
                  </a>
                )}
              </div>
              <div className="shrink-0">
                <AddToWatchlist
                  itemType="barrier"
                  itemId={b.id}
                  itemName={`${b.barrierType} barrier in ${b.countryName}`}
                  itemMeta={{
                    countryId: b.countryId,
                    type: b.barrierType,
                    impact: b.impactLevel,
                    status: b.status,
                  }}
                  variant="icon"
                  size="sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
