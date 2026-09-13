import { eq, and, desc, ilike, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { exporters, counties, sectors, products } from "@/db/schema";
import { ExporterFilters } from "@/components/exporter-filters";
import { AddToWatchlist } from "@/components/watchlist/add-to-watchlist";

export const revalidate = 3600;

export default async function ExportersPage({
  searchParams,
}: {
  searchParams: Promise<{
    sector?: string;
    county?: string;
    exportReady?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const sector = params.sector ?? "";
  const county = params.county ?? "";
  const exportReady = params.exportReady ?? "";
  const q = params.q ?? "";

  const [sectorOptions, countyOptions] = await Promise.all([
    db
      .select({ value: sql<string>`${sectors.id}::text`, label: sectors.name })
      .from(sectors)
      .orderBy(sectors.name),
    db
      .select({
        value: sql<string>`${counties.id}::text`,
        label: counties.name,
      })
      .from(counties)
      .orderBy(counties.name),
  ]);

  const conditions: SQL[] = [];
  if (sector) conditions.push(eq(exporters.sectorId, Number(sector)));
  if (county) conditions.push(eq(exporters.countyId, Number(county)));
  if (exportReady)
    conditions.push(eq(exporters.exportReady, exportReady === "true"));
  if (q) conditions.push(ilike(exporters.name, `%${q}%`));
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db
      .select({
        id: exporters.id,
        name: exporters.name,
        countyId: exporters.countyId,
        countyName: counties.name,
        sectorId: exporters.sectorId,
        sectorName: sectors.name,
        hsCode: products.hsCode,
        productDescription: products.description,
        employeesCount: exporters.employeesCount,
        annualCapacity: exporters.annualCapacity,
        capacityUnit: exporters.capacityUnit,
        certifications: exporters.certifications,
        exportReady: exporters.exportReady,
        contactEmail: exporters.contactEmail,
      })
      .from(exporters)
      .innerJoin(counties, eq(counties.id, exporters.countyId))
      .innerJoin(sectors, eq(sectors.id, exporters.sectorId))
      .innerJoin(products, eq(products.id, exporters.primaryProductId))
      .where(whereClause)
      .orderBy(desc(exporters.exportReady), desc(exporters.employeesCount))
      .limit(50),
    db
      .select({ count: sql<string>`count(*)` })
      .from(exporters)
      .where(whereClause),
  ]);

  return (
    <main className="flex min-h-full flex-1 flex-col bg-white dark:bg-zinc-950">
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-7 sm:px-8 sm:py-9">
      <div className="mb-5 flex items-start gap-3 sm:gap-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-kenya-green/10 text-kenya-green">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3.5 20v-1.5A4.5 4.5 0 0 1 8 14h2a4.5 4.5 0 0 1 4.5 4.5V20M16 5.5a3 3 0 0 1 0 5.8M16 14h1a4 4 0 0 1 4 4v2" /></svg>
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold leading-none tracking-tight text-ktp-navy dark:text-zinc-50 sm:text-4xl">Kenyan Exporters</h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 dark:text-zinc-400 sm:text-sm">
          Manufacturers and producers registered as capable of supplying a given
          product - find who can actually fulfil a market opportunity.
            </p>
          </div>
        </div>
      </div>

      <ExporterFilters
        sectors={sectorOptions}
        counties={countyOptions}
        selectedSector={sector}
        selectedCounty={county}
        selectedExportReady={exportReady}
        selectedQuery={q}
      />

      <div className="mt-5 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400">
        <p>Showing <span className="font-semibold text-ktp-navy dark:text-zinc-200">{rows.length}</span> of {count} matching exporters</p>
        <span className="hidden sm:inline">Sorted by <span className="font-medium text-slate-700 dark:text-zinc-300">Export readiness</span></span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 md:col-span-2 xl:col-span-3">
            No exporters match these filters.
          </p>
        )}
        {rows.map((e) => (
          <div
            key={e.id}
            className="rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-emerald-300 hover:shadow-[0_3px_12px_rgba(16,42,67,0.06)] dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-emerald-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-ktp-navy dark:text-zinc-50">{e.name}</h3>
                    <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-zinc-400">{e.countyName} · {e.sectorName}</p>
                  </div>
                  {e.exportReady && (
                    <span className="shrink-0 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-600 align-middle" />Ready</span>
                  )}
                </div>
                <a
                  href={`/explorer?hs=${e.hsCode}`}
                  className="mt-4 block line-clamp-2 text-xs font-medium leading-4 text-slate-700 hover:text-kenya-green hover:underline dark:text-zinc-200"
                >
                  {e.productDescription}
                </a>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 dark:border-zinc-800">
                  <div><p className="text-[10px] uppercase tracking-wide text-slate-400">Employees</p><p className="mt-1 text-xs font-semibold text-ktp-navy dark:text-zinc-200">{e.employeesCount.toLocaleString()}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wide text-slate-400">Capacity</p><p className="mt-1 text-xs font-semibold text-ktp-navy dark:text-zinc-200">{e.annualCapacity.toLocaleString()} {e.capacityUnit}</p></div>
                </div>
                {e.certifications.length > 0 && (
                  <div className="mt-3 truncate text-[10px] text-slate-500 dark:text-zinc-400">
                    Certifications: {e.certifications.join(" · ")}
                  </div>
                )}
                {e.contactEmail && (
                  <p className="mt-2 truncate text-xs text-slate-500 dark:text-zinc-400">
                    {e.contactEmail}
                  </p>
                )}
              </div>
              <div className="shrink-0">
                <AddToWatchlist
                  itemType="exporter"
                  itemId={e.id}
                  itemName={e.name}
                  itemMeta={{
                    countyId: e.countyId,
                    county: e.countyName,
                    sectorId: e.sectorId,
                    sector: e.sectorName,
                    exportReady: e.exportReady,
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
