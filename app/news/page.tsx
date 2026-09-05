import { eq, and, desc, sql, type SQL } from "drizzle-orm";
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
  searchParams: Promise<{ category?: string; country?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? "";
  const country = params.country ?? "";

  const countryOptions = await db
    .select({ value: sql<string>`${countries.id}::text`, label: countries.name })
    .from(countries)
    .innerJoin(newsArticles, eq(newsArticles.relatedCountryId, countries.id))
    .groupBy(countries.id, countries.name)
    .orderBy(countries.name);

  const conditions: SQL[] = [];
  if (category) conditions.push(eq(newsArticles.category, category));
  if (country) conditions.push(eq(newsArticles.relatedCountryId, Number(country)));
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
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
  ]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-1 flex-col px-6 py-10 sm:px-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Trade News
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Kenya-related trade, tariff, agreement, and logistics news, ingested from live news
          sources and refreshed every six hours.
        </p>
      </div>

      <NewsFilters countries={countryOptions} selectedCategory={category} selectedCountry={country} />

      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
        Showing {rows.length} of {count} matching articles.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {rows.length === 0 && (
          <p className="rounded-2xl border border-stone-300 bg-white/70 p-5 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-400">
            No articles match these filters.
          </p>
        )}
        {rows.map((a) => (
          <a
            key={a.id}
            href={a.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-stone-300 bg-white/70 p-5 transition hover:border-kenya-green/60 dark:border-zinc-700 dark:bg-zinc-800/70"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_STYLES[a.category] ?? ""}`}
              >
                {a.category}
              </span>
              {a.countryName && (
                <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                  {a.countryName}
                </span>
              )}
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {a.sourceName} · {a.publishedAt}
              </span>
              {a.sourceUrl.startsWith("https://example.com/") && (
                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                  Mock article
                </span>
              )}
            </div>
            <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{a.title}</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{a.summary}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
