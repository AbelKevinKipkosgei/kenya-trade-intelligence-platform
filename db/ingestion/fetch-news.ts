import "../seed/load-env";
import { db, pool } from "../client";
import { newsArticles, countries } from "../schema";

/**
 * Pulls Kenya trade news from NewsAPI.org and upserts it into
 * news_articles. Idempotent — relies on the unique constraint on
 * source_url (ON CONFLICT DO NOTHING), so it's safe to run repeatedly
 * (e.g. daily via GitHub Actions).
 *
 * KNOWN LIMITATION: NewsAPI's free-tier /v2/everything search has no
 * proximity/context awareness — it matches "Kenya" and a trade keyword
 * anywhere in an article's full stored text, which pulls in genuine
 * false positives (e.g. a global markets roundup that mentions Kenya
 * once in passing). The relevance filter below requires both signals to
 * appear in the title+description specifically (not the full body),
 * which in testing cut a ~90% noise rate down to a handful of clearly
 * on-topic articles per fetch — good enough to be useful, not perfect.
 * A real upgrade path here is LLM-based relevance classification instead
 * of regex, at the cost of a small per-article API call.
 */

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const PAGE_SIZE = 50;

const QUERY =
  'Kenya AND (trade OR export OR import OR tariff OR customs OR COMESA OR "East African Community" OR AfCFTA OR AGOA OR "trade agreement")';

const KENYA_SIGNAL = /\bkenya|kenyan|nairobi|mombasa|\bruto\b|\beac\b|comesa|east african community\b/i;
const TRADE_SIGNAL =
  /\btrade\b|\bexport|\bimport|\btariff|\bcustoms\b|\bcomesa\b|\beac\b|\bafcfta\b|\bagoa\b|trade agreement|\bcargo\b/i;

type NewsApiArticle = {
  title: string;
  description: string | null;
  url: string;
  source: { name: string };
  publishedAt: string;
};

const CATEGORY_RULES: { category: string; pattern: RegExp }[] = [
  { category: "agreement", pattern: /\bagreement\b|\bafcfta\b|\bcomesa\b|\bagoa\b|\btreaty\b|\btrade deal\b/i },
  { category: "tariff", pattern: /\btariff|\bduty\b|\bduties\b|import duty|excise/i },
  { category: "policy", pattern: /\bpolicy\b|\bregulation|\bban\b|\brestriction|\bdirective\b|\bgazette\b/i },
  { category: "logistics", pattern: /\bport\b|\bshipping\b|\bcargo\b|\bfreight\b|\brailway\b|\blogistics\b|\btransit\b|\bclearance\b/i },
];

function classifyCategory(text: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(text)) return rule.category;
  }
  return "market";
}

async function fetchArticles(): Promise<NewsApiArticle[]> {
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", QUERY);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", String(PAGE_SIZE));
  url.searchParams.set("apiKey", NEWS_API_KEY!);

  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "ok") {
    throw new Error(`NewsAPI error: ${data.code ?? res.status} ${data.message ?? "unknown error"}`);
  }
  return data.articles as NewsApiArticle[];
}

async function main() {
  if (!NEWS_API_KEY) {
    throw new Error("NEWS_API_KEY is not set");
  }

  console.log("Fetching Kenya trade news from NewsAPI...");
  const articles = await fetchArticles();
  console.log(`  fetched ${articles.length} candidates`);

  const relevant = articles.filter((a) => {
    const text = `${a.title} ${a.description ?? ""}`;
    return KENYA_SIGNAL.test(text) && TRADE_SIGNAL.test(text);
  });
  console.log(`  ${relevant.length} passed the relevance filter`);

  const countryRows = await db
    .select({ id: countries.id, name: countries.name })
    .from(countries)
    .orderBy(countries.name);
  // Longest names first so "South Africa" matches before a shorter
  // substring could, and Kenya itself is excluded (redundant — every
  // article here is already about Kenya).
  const countryCandidates = countryRows
    .filter((c) => c.name !== "Kenya")
    .sort((a, b) => b.name.length - a.name.length);

  function matchCountry(text: string): number | null {
    for (const c of countryCandidates) {
      const re = new RegExp(`\\b${c.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(text)) return c.id;
    }
    return null;
  }

  const rows = relevant.map((a) => {
    const text = `${a.title} ${a.description ?? ""}`;
    return {
      title: a.title.slice(0, 300),
      summary: (a.description ?? a.title).slice(0, 2000),
      sourceName: a.source.name || "Unknown",
      sourceUrl: a.url,
      publishedAt: new Date(a.publishedAt),
      category: classifyCategory(text),
      relatedCountryId: matchCountry(text),
    };
  });

  if (rows.length === 0) {
    console.log("Nothing new to insert.");
    await pool.end();
    return;
  }

  const inserted = await db.insert(newsArticles).values(rows).onConflictDoNothing().returning({ id: newsArticles.id });
  console.log(`Inserted ${inserted.length} new articles (${rows.length - inserted.length} already existed).`);

  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
