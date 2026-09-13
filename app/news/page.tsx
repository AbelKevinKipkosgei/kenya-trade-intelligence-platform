import { eq, and, desc, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { newsArticles, countries } from "@/db/schema";
import { NewsFilters } from "@/components/news-filters";

export const revalidate = 900;

const CATEGORY_STYLES: Record<string, string> = {
  tariff: "bg-kenya-red/10 text-kenya-red",
  agreement: "bg-kenya-green/10 text-kenya-green",
  policy: "bg-amber-500/10 text-amber-700 dark:text-amber-500",
  logistics: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  market: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; country?: string; search?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? "";
  const country = params.country ?? "";
  const search = params.search?.trim() ?? "";

  const countryOptions = await db
    .select({ value: sql<string>`${countries.id}::text`, label: countries.name })
    .from(countries)
    .innerJoin(newsArticles, eq(newsArticles.relatedCountryId, countries.id))
    .groupBy(countries.id, countries.name)
    .orderBy(countries.name);

  const conditions: SQL[] = [];
  if (category) conditions.push(eq(newsArticles.category, category));
  if (country) conditions.push(eq(newsArticles.relatedCountryId, Number(country)));
  if (search) {
    conditions.push(
      or(
        ilike(newsArticles.title, `%${search}%`),
        ilike(newsArticles.summary, `%${search}%`),
        ilike(newsArticles.sourceName, `%${search}%`),
      )!,
    );
  }
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ count }], [{ total }], [{ sources }], categoryCounts] = await Promise.all([
    db
      .select({
        id: newsArticles.id,
        title: newsArticles.title,
        summary: newsArticles.summary,
        sourceName: newsArticles.sourceName,
        sourceUrl: newsArticles.sourceUrl,
        publishedAt: sql<string>`to_char(${newsArticles.publishedAt}, 'YYYY-MM-DD')`,
        category: newsArticles.category,
        countryName: countries.name,
      })
      .from(newsArticles)
      .leftJoin(countries, eq(countries.id, newsArticles.relatedCountryId))
      .where(whereClause)
      .orderBy(desc(newsArticles.publishedAt))
      .limit(50),
    db.select({ count: sql<string>`count(*)` }).from(newsArticles).where(whereClause),
    db.select({ total: sql<string>`count(*)` }).from(newsArticles),
    db.select({ sources: sql<string>`count(distinct ${newsArticles.sourceName})` }).from(newsArticles),
    db.select({ category: newsArticles.category, count: sql<string>`count(*)` }).from(newsArticles).groupBy(newsArticles.category).orderBy(desc(sql`count(*)`)).limit(5),
  ]);

  return (
    <main className="flex min-h-full flex-1 flex-col bg-white dark:bg-zinc-950">
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-7 sm:px-8 sm:py-9">
      <div className="mb-5 flex items-start gap-3 sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-kenya-green/10 text-kenya-green">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /><path d="M8 4v2" /></svg>
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold leading-none tracking-tight text-ktp-navy dark:text-zinc-50 sm:text-4xl">Trade News</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500 dark:text-zinc-400 sm:text-sm">
          Kenya-related trade, tariff, agreement, and logistics news, ingested from live news
          sources and refreshed every six hours.
          </p>
          <p className="mt-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Updated recently from trusted news sources</p>
        </div>
      </div>

      <NewsFilters countries={countryOptions} selectedCategory={category} selectedCountry={country} selectedSearch={search} />

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-emerald-100 bg-[#f5fcf9] p-3 dark:border-emerald-900 dark:bg-emerald-950/20 sm:grid-cols-4">
        <Metric label="Total articles" value={Number(total).toLocaleString()} />
        <Metric label="Today" value={rows.filter((article) => article.publishedAt === new Date().toISOString().slice(0, 10)).length.toLocaleString()} />
        <Metric label="Markets covered" value={countryOptions.length.toLocaleString()} />
        <Metric label="Sources" value={Number(sources).toLocaleString()} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ktp-navy dark:text-zinc-50">Latest trade intelligence</h2>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400">Showing {rows.length} of {count}</span>
        </div>
        <div className="flex flex-col gap-2">
        {rows.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No articles match these filters.
          </p>
        )}
        {rows.map((a) => (
          <a
            key={a.id}
            href={a.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-emerald-300 hover:shadow-[0_2px_10px_rgba(16,42,67,0.05)] dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-emerald-900 sm:p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold ${CATEGORY_STYLES[a.category] ?? ""}`}
              >
                {a.category}
              </span>
              {a.countryName && (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {a.countryName}
                </span>
              )}
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                {a.sourceName} · {a.publishedAt}
              </span>
              {a.sourceUrl.startsWith("https://example.com/") && (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                  Mock article
                </span>
              )}
            </div>
            <p className="mt-2 text-sm font-semibold leading-5 text-ktp-navy dark:text-zinc-50">{a.title}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-4 text-slate-500 dark:text-zinc-400">{a.summary}</p>
          </a>
        ))}
        </div>
      </section>
      <aside className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="font-display text-lg font-semibold text-ktp-navy dark:text-zinc-50">Coverage by topic</h2>
          <div className="mt-3 space-y-3">{categoryCounts.map((item, index) => <div key={item.category} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-slate-600 dark:text-zinc-300"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-zinc-800">{index + 1}</span>{item.category}</span><span className="font-semibold text-emerald-700 dark:text-emerald-300">{Number(item.count).toLocaleString()}</span></div>)}</div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-[#f5fcf9] p-4 dark:border-emerald-900 dark:bg-emerald-950/20"><p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">News pulse</p><p className="mt-1 text-xs leading-4 text-slate-500 dark:text-zinc-400">Fresh trade coverage is refreshed every six hours from the ingestion pipeline.</p></div>
      </aside>
      </div>
    </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="border-r border-emerald-100 px-3 last:border-0 dark:border-emerald-900"><p className="text-[10px] text-slate-500 dark:text-zinc-400">{label}</p><p className="mt-1 text-lg font-bold leading-none text-ktp-navy dark:text-zinc-100">{value}</p></div>;
}
