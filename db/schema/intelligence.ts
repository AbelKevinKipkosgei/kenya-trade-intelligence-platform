import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  numeric,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { countries } from "./core";
import { products } from "./trade";

/**
 * Market Opportunity Engine output. Seeded here with a defensible formula
 * for realism, but this is the table InsightGrid is expected to eventually
 * own/recompute — the app should treat it as replaceable, not hand-rolled
 * business logic to build on top of.
 */
export const marketOpportunityScores = pgTable(
  "market_opportunity_scores",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id),
    period: date("period").notNull(), // first day of the quarter
    demandScore: numeric("demand_score", { precision: 5, scale: 2 }).notNull(),
    growthScore: numeric("growth_score", { precision: 5, scale: 2 }).notNull(),
    competitivenessScore: numeric("competitiveness_score", {
      precision: 5,
      scale: 2,
    }).notNull(),
    marketAccessScore: numeric("market_access_score", {
      precision: 5,
      scale: 2,
    }).notNull(),
    competitionScore: numeric("competition_score", {
      precision: 5,
      scale: 2,
    }).notNull(),
    logisticsScore: numeric("logistics_score", {
      precision: 5,
      scale: 2,
    }).notNull(),
    domesticCapacityScore: numeric("domestic_capacity_score", {
      precision: 5,
      scale: 2,
    }).notNull(),
    overallScore: numeric("overall_score", { precision: 5, scale: 2 }).notNull(),
    computedAt: timestamp("computed_at").defaultNow().notNull(),
  },
  (t) => [
    index("mos_product_country_period_idx").on(
      t.productId,
      t.countryId,
      t.period,
    ),
  ],
);

/**
 * Trade news feed. Seeded with mock articles initially; now also backed by
 * a real NewsAPI.org ingestion pipeline (db/ingestion/fetch-news.ts). The
 * unique constraint on sourceUrl is what makes repeated ingestion runs
 * idempotent (ON CONFLICT DO NOTHING) instead of accumulating duplicates.
 */
export const newsArticles = pgTable(
  "news_articles",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 300 }).notNull(),
    summary: text("summary").notNull(),
    sourceName: varchar("source_name", { length: 150 }).notNull(),
    sourceUrl: varchar("source_url", { length: 500 }).notNull().unique(),
    publishedAt: timestamp("published_at").notNull(),
    category: varchar("category", { length: 30 }).notNull(), // tariff | agreement | market | policy | logistics
    relatedProductId: integer("related_product_id").references(
      () => products.id,
    ),
    relatedCountryId: integer("related_country_id").references(
      () => countries.id,
    ),
  },
  (t) => [index("news_published_idx").on(t.publishedAt)],
);
