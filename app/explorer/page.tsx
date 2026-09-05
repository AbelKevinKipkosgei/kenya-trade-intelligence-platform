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

const PROCEDURE_CATEGORY_LABELS: Record<string, string> = {
  import: "Importing",
  export: "Exporting",
  certification: "Certification",
  licensing: "Licensing",
  customs: "Customs & Duties",
};

function SectionIcon({ bg, text, children }: { bg: string; text: string; children: React.ReactNode }) {
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg} ${text}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {children}
      </svg>
    </span>
  );
}

function SectionHeading({
  bg,
  text,
  title,
  icon,
}: {
  bg: string;
  text: string;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <SectionIcon bg={bg} text={text}>
        {icon}
      </SectionIcon>
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
    </div>
  );
}

function MarketList({ rows }: { rows: { countryId: number; countryName: string; totalValue: string }[] }) {
  const max = Math.max(...rows.map((m) => Number(m.totalValue)), 1);
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((m) => (
        <li key={m.countryId} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">{m.countryName}</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{formatUsd(m.totalValue)}</span>
          </div>
          <div className="h-1 w-full rounded-full bg-stone-200 dark:bg-zinc-700">
            <div
              className="h-1 rounded-full bg-kenya-green"
              style={{ width: `${(Number(m.totalValue) / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

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
      sourceUrl: newsArticles.sourceUrl,
    })
    .from(newsArticles)
    .where(eq(newsArticles.relatedProductId, productId))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(5);
}

async function loadProcedures(sectorId: number) {
  return db
    .select({ id: procedures.id, title: procedures.title, category: procedures.category })
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
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-kenya-green/10 text-kenya-green dark:bg-kenya-green/20">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
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
          <div className="grid gap-2 sm:grid-cols-2">
            {samples.map((s) => (
              <a
                key={s.hsCode}
                href={`/explorer?hs=${s.hsCode}`}
                className="rounded-xl border border-stone-300 bg-white/60 px-4 py-3 text-sm text-zinc-700 transition-colors hover:border-kenya-green hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:text-zinc-50"
              >
                <span className="font-medium">{s.hsCode}</span> – {s.description}
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
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-kenya-green/10 text-kenya-green dark:bg-kenya-green/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
          </span>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-kenya-green">
              {product.sectorName}
            </span>
            <h1 className="mt-0.5 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {product.description}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              HS Code {product.hsCode} · Traded in {product.unit}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-stone-300 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-800/70">
          <SectionHeading
            bg="bg-kenya-green/10"
            text="text-kenya-green"
            title="Top Export Markets"
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 7.5L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            }
          />
          {exportMarkets.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No export transactions recorded.</p>
          ) : (
            <MarketList rows={exportMarkets} />
          )}
        </section>

        <section className="rounded-2xl border border-stone-300 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-800/70">
          <SectionHeading
            bg="bg-blue-500/10"
            text="text-blue-600 dark:text-blue-400"
            title="Top Import Sources"
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            }
          />
          {importMarkets.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No import transactions recorded.</p>
          ) : (
            <MarketList rows={importMarkets} />
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-stone-300 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-800/70">
        <SectionHeading
          bg="bg-amber-500/10"
          text="text-amber-700 dark:text-amber-500"
          title="Tariff Rates by Market"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 7h6m0 10v-3m-3 3v-6m-3 6v-9m-2 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          }
        />
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
                    <td className="border-b border-stone-200 py-2 pr-4 dark:border-zinc-800">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          t.rateType === "preferential"
                            ? "bg-kenya-green/10 text-kenya-green"
                            : "bg-stone-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {t.rateType}
                      </span>
                    </td>
                    <td className="border-b border-stone-200 py-2 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      {t.agreementCode ?? "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-stone-300 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-800/70">
        <SectionHeading
          bg="bg-kenya-red/10"
          text="text-kenya-red"
          title="Active Trade Barriers"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          }
        />
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
          <SectionHeading
            bg="bg-violet-500/10"
            text="text-violet-600 dark:text-violet-400"
            title="Kenyan Exporters (Export Capacity)"
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
              />
            }
          />
          {exporterRows.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No registered exporters for this product.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {exporterRows.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex flex-wrap items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                    {e.name}
                    {e.exportReady && (
                      <span className="rounded-full bg-kenya-green/10 px-2 py-0.5 text-[11px] font-medium text-kenya-green">
                        Export-ready
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{e.countyName}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-stone-300 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-800/70">
          <SectionHeading
            bg="bg-cyan-500/10"
            text="text-cyan-700 dark:text-cyan-400"
            title="Related Procedures"
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            }
          />
          {procedureRows.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No related procedures found.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {procedureRows.map((p) => (
                <li key={p.id}>
                  <a
                    href={`/getting-started#${p.category}`}
                    className="text-sm text-kenya-green hover:underline"
                  >
                    {p.title}
                  </a>
                  <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    {PROCEDURE_CATEGORY_LABELS[p.category] ?? p.category}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {newsRows.length > 0 && (
        <section className="mt-6 rounded-2xl border border-stone-300 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-800/70">
          <SectionHeading
            bg="bg-zinc-500/10"
            text="text-zinc-600 dark:text-zinc-400"
            title="Related News"
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
              />
            }
          />
          <ul className="flex flex-col gap-2">
            {newsRows.map((n) => (
              <li key={n.id} className="text-sm">
                <a
                  href={n.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-kenya-green hover:underline"
                >
                  {n.title}
                </a>
                <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">{n.sourceName}</span>
                {n.sourceUrl.startsWith("https://example.com/") && (
                  <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                    Mock article
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
