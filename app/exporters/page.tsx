import { eq, and, desc, ilike, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { exporters, counties, sectors, products } from "@/db/schema";
import { ExporterFilters } from "@/components/exporter-filters";

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
        countyName: counties.name,
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
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-1 flex-col px-6 py-10 sm:px-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Kenyan Export Capacity Map
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manufacturers and producers registered as capable of supplying a given
          product - find who can actually fulfil a market opportunity.
        </p>
      </div>

      <ExporterFilters
        sectors={sectorOptions}
        counties={countyOptions}
        selectedSector={sector}
        selectedCounty={county}
        selectedExportReady={exportReady}
        selectedQuery={q}
      />

      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
        Showing {rows.length} of {count} matching exporters.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {rows.length === 0 && (
          <p className="rounded-2xl border border-stone-300 bg-white/70 p-5 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-400 sm:col-span-2">
            No exporters match these filters.
          </p>
        )}
        {rows.map((e) => (
          <div
            key={e.id}
            className="rounded-2xl border border-stone-300 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-800/70"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {e.name}
              </h3>
              {e.exportReady && (
                <span className="shrink-0 rounded-full bg-kenya-green/10 px-2 py-0.5 text-xs font-medium text-kenya-green">
                  Export-ready
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {e.countyName} · {e.sectorName}
            </p>
            <a
              href={`/explorer?hs=${e.hsCode}`}
              className="mt-2 inline-block text-sm text-kenya-green hover:underline"
            >
              {e.productDescription}
            </a>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {e.employeesCount.toLocaleString()} employees ·{" "}
              {e.annualCapacity.toLocaleString()} {e.capacityUnit} capacity
            </p>
            {e.certifications.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {e.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="rounded-full bg-stone-200 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            )}
            {e.contactEmail && (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {e.contactEmail}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
