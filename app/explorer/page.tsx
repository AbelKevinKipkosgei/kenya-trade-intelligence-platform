import { eq, and, or, isNull, desc, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  products,
  sectors,
  countries,
  tariffs,
  tradeAgreements,
  tradeBarriers,
  agencies,
  exporters,
  counties,
  newsArticles,
  tradeTransactions,
  procedures,
} from "@/db/schema";
import { ProductSearchBox } from "@/components/product-search-box";

export const revalidate = 3600;

function formatUsd(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

async function loadProduct(hsCode: string) {
  const [product] = await db
    .select({
      id: products.id,
      hsCode: products.hsCode,
      description: products.description,
      unit: products.unit,
      sectorId: products.sectorId,
      sectorName: sectors.name,
    })
    .from(products)
    .innerJoin(sectors, eq(sectors.id, products.sectorId))
    .where(eq(products.hsCode, hsCode))
    .limit(1);
  return product ?? null;
}

async function loadTopMarkets(productId: number, flowType: "export" | "import") {
  return db
    .select({
      countryId: countries.id,
      countryName: countries.name,
      totalValue: sql<string>`sum(${tradeTransactions.valueUsd})`,
      txCount: sql<string>`count(*)`,
    })
    .from(tradeTransactions)
    .innerJoin(countries, eq(countries.id, tradeTransactions.countryId))
    .where(and(eq(tradeTransactions.productId, productId), eq(tradeTransactions.flowType, flowType)))
    .groupBy(countries.id, countries.name)
    .orderBy(desc(sql`sum(${tradeTransactions.valueUsd})`))
    .limit(8);
}

async function loadTariffs(productId: number) {
  return db
    .select({
      countryName: countries.name,
      ratePercent: tariffs.ratePercent,
      rateType: tariffs.rateType,
      agreementCode: tradeAgreements.code,
    })
    .from(tariffs)
    .innerJoin(countries, eq(countries.id, tariffs.countryId))
    .leftJoin(tradeAgreements, eq(tradeAgreements.id, tariffs.agreementId))
    .where(eq(tariffs.productId, productId))
    .orderBy(countries.name, tariffs.ratePercent)
    .limit(60);
}

async function loadBarriers(productId: number) {
  return db
    .select({
      id: tradeBarriers.id,
      countryName: countries.name,
      barrierType: tradeBarriers.barrierType,
      description: tradeBarriers.description,
      impactLevel: tradeBarriers.impactLevel,
      agencyName: agencies.name,
      reportedDate: tradeBarriers.reportedDate,
    })
    .from(tradeBarriers)
    .innerJoin(countries, eq(countries.id, tradeBarriers.countryId))
    .innerJoin(agencies, eq(agencies.id, tradeBarriers.sourceAgencyId))
    .where(and(eq(tradeBarriers.productId, productId), eq(tradeBarriers.status, "active")))
    .orderBy(desc(tradeBarriers.reportedDate))
    .limit(10);
}

async function loadExporters(productId: number) {
  return db
    .select({
      id: exporters.id,
      name: exporters.name,
      countyName: counties.name,
      exportReady: exporters.exportReady,
    })
    .from(exporters)
    .innerJoin(counties, eq(counties.id, exporters.countyId))
    .where(eq(exporters.primaryProductId, productId))
    .limit(10);
}

async function loadNews(productId: number) {
  return db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      publishedAt: newsArticles.publishedAt,
      sourceName: newsArticles.sourceName,
    })
    .from(newsArticles)
    .where(eq(newsArticles.relatedProductId, productId))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(5);
}

async function loadProcedures(sectorId: number) {
  return db
    .select({ id: procedures.id, title: procedures.title, category: procedures.category, slug: procedures.slug })
    .from(procedures)
    .where(or(eq(procedures.sectorId, sectorId), isNull(procedures.sectorId)))
    .limit(6);
}

async function loadSampleProducts() {
  return db
    .select({ hsCode: products.hsCode, description: products.description })
    .from(products)
    .orderBy(products.hsCode)
    .limit(8);
}

export default async function ExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ hs?: string }>;
}) {
  const { hs } = await searchParams;
  const product = hs ? await loadProduct(hs) : null;

  if (!product) {
    const samples = await loadSampleProducts();
    return (
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-1 flex-col px-6 py-10 sm:px-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Market &amp; Product Explorer
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Look up a product by HS code or name to see export performance, top markets, tariffs,
          active barriers, capable exporters, and related news in one place.
        </p>
        <div className="mt-6">
          <ProductSearchBox autoFocus />
        </div>
        {hs && (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            No product found for HS code &quot;{hs}&quot;.
          </p>
        )}
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Or try one of these
          </h2>
          <div className="flex flex-col gap-2">
            {samples.map((s) => (
              <a
                key={s.hsCode}
                href={`/explorer?hs=${s.hsCode}`}
                className="rounded-xl border border-stone-300 bg-white/60 px-4 py-3 text-sm text-zinc-700 transition-colors hover:border-kenya-green hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:text-zinc-50"
              >
                <span className="font-medium">{s.hsCode}</span> — {s.description}
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const [exportMarkets, importMarkets, tariffRows, barrierRows, exporterRows, newsRows, procedureRows] =
    await Promise.all([
      loadTopMarkets(product.id, "export"),
      loadTopMarkets(product.id, "import"),
      loadTariffs(product.id),
      loadBarriers(product.id),
      loadExporters(product.id),
      loadNews(product.id),
      loadProcedures(product.sectorId),
    ]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-1 flex-col px-6 py-10 sm:px-10">
      <div className="mb-6">
        <ProductSearchBox />
      </div>

      <div className="mb-8 rounded-2xl border border-stone-300 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-800/70">
        <span className="text-xs font-semibold uppercase tracking-wide text-kenya-green">
          {product.sectorName}
        </span>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {product.description}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          HS Code {product.hsCode} · Traded in {product.unit}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-stone-300 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-800/70">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Top Export Markets
          </h2>
          {exportMarkets.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No export transactions recorded.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {exportMarkets.map((m) => (
                <li key={m.countryId} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-300">{m.countryName}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {formatUsd(m.totalValue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-stone-300 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-800/70">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Top Import Sources
          </h2>
          {importMarkets.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No import transactions recorded.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {importMarkets.map((m) => (
                <li key={m.countryId} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-300">{m.countryName}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {formatUsd(m.totalValue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-stone-300 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-800/70">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Tariff Rates by Market</h2>
        {tariffRows.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No tariff data recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="border-b border-stone-300 py-2 pr-4 dark:border-zinc-700">Market</th>
                  <th className="border-b border-stone-300 py-2 pr-4 dark:border-zinc-700">Rate</th>
                  <th className="border-b border-stone-300 py-2 pr-4 dark:border-zinc-700">Type</th>
                  <th className="border-b border-stone-300 py-2 dark:border-zinc-700">Agreement</th>
                </tr>
              </thead>
              <tbody>
                {tariffRows.map((t, i) => (
                  <tr key={i}>
                    <td className="border-b border-stone-200 py-2 pr-4 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                      {t.countryName}
                    </td>
                    <td className="border-b border-stone-200 py-2 pr-4 font-medium text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
                      {Number(t.ratePercent).toFixed(1)}%
                    </td>
                    <td className="border-b border-stone-200 py-2 pr-4 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      {t.rateType}
                    </td>
                    <td className="border-b border-stone-200 py-2 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      {t.agreementCode ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-stone-300 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-800/70">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Active Trade Barriers</h2>
        {barrierRows.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No active barriers recorded for this product.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {barrierRows.map((b) => (
              <li key={b.id} className="text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{b.countryName}</span>
                  <span className="rounded-full bg-kenya-red/10 px-2 py-0.5 text-xs font-medium text-kenya-red">
                    {b.impactLevel} impact
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {b.barrierType} · {b.agencyName}
                  </span>
                </div>
                <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">{b.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-stone-300 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-800/70">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Kenyan Exporters (Export Capacity)
          </h2>
          {exporterRows.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No registered exporters for this product.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {exporterRows.map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-300">{e.name}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{e.countyName}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-stone-300 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-800/70">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Related Procedures</h2>
          <ul className="flex flex-col gap-2">
            {procedureRows.map((p) => (
              <li key={p.id}>
                <a href="/getting-started" className="text-sm text-kenya-green hover:underline">
                  {p.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {newsRows.length > 0 && (
        <section className="mt-6 rounded-2xl border border-stone-300 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-800/70">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Related News</h2>
          <ul className="flex flex-col gap-2">
            {newsRows.map((n) => (
              <li key={n.id} className="text-sm">
                <span className="text-zinc-800 dark:text-zinc-200">{n.title}</span>
                <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">{n.sourceName}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
