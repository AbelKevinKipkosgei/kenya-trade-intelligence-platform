import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { tradeBarriers, products, sectors, countries, agencies } from "@/db/schema";
import { BarrierFilters } from "@/components/barrier-filters";
import { AddToWatchlist } from "@/components/watchlist/add-to-watchlist";

export const revalidate = 3600;

const IMPACT_STYLES: Record<string, string> = {
  high: "bg-red-50 text-kenya-red dark:bg-red-950/40 dark:text-red-300",
  medium: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  low: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400",
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
        countryIso2: countries.iso2,
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
    <main className="flex min-h-full flex-1 flex-col bg-white dark:bg-zinc-950">
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-7 sm:px-8 sm:py-9">
      <div className="mb-5 flex items-start gap-3 sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-kenya-green/10 text-kenya-green">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M12 3 4.5 6v5.5c0 4.5 3.2 7.8 7.5 9.5 4.3-1.7 7.5-5 7.5-9.5V6L12 3Z" />
            <path d="m8.5 12 2.2 2.2 4.8-5" />
          </svg>
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold leading-none tracking-tight text-ktp-navy dark:text-zinc-50 sm:text-4xl">
            Trade Barrier Monitor
          </h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500 dark:text-zinc-400 sm:text-sm">
          Non-tariff barriers, SPS/technical requirements, quotas, and licensing issues affecting
          Kenyan exports, as reported by the responsible agency.
          </p>
        </div>
      </div>

      <BarrierFilters
        sectors={sectorOptions}
        countries={countryOptions}
        selectedStatus={status}
        selectedType={type}
        selectedSector={sector}
        selectedCountry={country}
      />

      <div className="mt-5 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400">
        <p>Showing <span className="font-semibold text-ktp-navy dark:text-zinc-200">{rows.length}</span> of {count} matching barriers</p>
        <span className="hidden sm:inline">Sorted by <span className="font-medium text-slate-700 dark:text-zinc-300">Date (newest)</span></span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {rows.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No barriers match these filters.
          </p>
        )}
        {rows.map((b) => (
          <div
            key={b.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(16,42,67,0.05)] transition-colors hover:border-emerald-200 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-emerald-900"
          >
            <div className="flex flex-col sm:flex-row">
              <div className="flex w-full shrink-0 items-center gap-3 border-b border-slate-100 bg-[#fbfdfd] px-5 py-4 sm:w-56 sm:flex-col sm:items-start sm:justify-center sm:border-b-0 sm:border-r dark:border-zinc-800 dark:bg-zinc-950/40">
                <img src={`https://flagcdn.com/w40/${b.countryIso2.toLowerCase()}.png`} alt={`${b.countryName} flag`} width={40} height={28} loading="lazy" className="h-9 w-12 rounded-full object-cover shadow-[0_0_0_1px_rgba(15,23,42,0.08)]" />
                <div>
                  <p className="font-semibold text-ktp-navy dark:text-zinc-100">{b.countryName}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">Destination market</p>
                  {b.hsCode && <a href={`/explorer?hs=${b.hsCode}`} className="mt-2 block text-[11px] font-medium text-kenya-green hover:underline">View product profile →</a>}
                </div>
              </div>
              <div className="min-w-0 flex-1 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${IMPACT_STYLES[b.impactLevel] ?? ""}`}>
                    {b.impactLevel} impact
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold capitalize text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-600 align-middle" />{b.status}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">{b.barrierType}</span>
                </div>
                <h2 className="mt-2 text-sm font-semibold leading-5 text-ktp-navy dark:text-zinc-100">{b.description}</h2>
                {b.hsCode && <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">{b.productDescription} {b.sectorName ? ` · ${b.sectorName}` : ""}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-slate-500 dark:text-zinc-400">
                  <span>Reported {b.reportedDate}</span>
                  <span>{b.agencyName}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 px-5 py-3 sm:w-28 sm:flex-col sm:justify-center sm:border-l sm:border-t-0 dark:border-zinc-800">
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
    </main>
  );
}
