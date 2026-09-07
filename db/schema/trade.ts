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
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { agencies, countries, sectors } from "./core";

/** HS-code-level product catalog used across the whole platform. */
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    hsCode: varchar("hs_code", { length: 10 }).notNull().unique(),
    description: text("description").notNull(),
    sectorId: integer("sector_id")
      .notNull()
      .references(() => sectors.id),
    unit: varchar("unit", { length: 20 }).notNull(), // kg | tonnes | litres | units
  },
  (t) => [index("products_sector_idx").on(t.sectorId)],
);

/** EAC, COMESA, AfCFTA, AGOA, EU-EPA, WTO-MFN, bilateral deals, etc. */
export const tradeAgreements = pgTable("trade_agreements", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  enteredIntoForce: date("entered_into_force"),
  status: varchar("status", { length: 20 }).notNull(), // active | pending | suspended
});

export const agreementMembers = pgTable(
  "agreement_members",
  {
    id: serial("id").primaryKey(),
    agreementId: integer("agreement_id")
      .notNull()
      .references(() => tradeAgreements.id),
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id),
    joinedDate: date("joined_date"),
  },
  (t) => [
    uniqueIndex("agreement_members_unique").on(t.agreementId, t.countryId),
  ],
);

/**
 * A tariff rate applicable to a product when traded with a given country.
 * rateSource distinguishes a genuine, sourced rate from an estimated one —
 * see db/tariffs/fetch-real-mfn-rates.ts, which overwrites MFN rows with
 * real WITS/TRAINS data where available and leaves the rest on the
 * synthetic generator's estimate. Preferential rates (EAC/COMESA/AGOA/
 * AfCFTA/EU/UK) stay estimated for now — real-world eligibility for those
 * depends on product-specific rules of origin and exclusions that a
 * blanket lookup can't safely capture without risking a confidently
 * wrong "real" figure.
 */
export const tariffs = pgTable(
  "tariffs",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id),
    agreementId: integer("agreement_id").references(() => tradeAgreements.id),
    ratePercent: numeric("rate_percent", { precision: 6, scale: 3 }).notNull(),
    rateType: varchar("rate_type", { length: 20 }).notNull(), // mfn | preferential | specific
    rateSource: varchar("rate_source", { length: 20 }).notNull().default("estimated"), // real | estimated
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    sourceAgencyId: integer("source_agency_id")
      .notNull()
      .references(() => agencies.id),
  },
  (t) => [
    index("tariffs_product_country_idx").on(t.productId, t.countryId),
  ],
);

/** Non-tariff barriers, SPS/technical requirements, quotas, etc. */
export const tradeBarriers = pgTable(
  "trade_barriers",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").references(() => products.id),
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id),
    sourceAgencyId: integer("source_agency_id")
      .notNull()
      .references(() => agencies.id),
    barrierType: varchar("barrier_type", { length: 40 }).notNull(), // non_tariff | sps | technical | quota | licensing
    description: text("description").notNull(),
    status: varchar("status", { length: 20 }).notNull(), // active | monitoring | resolved
    impactLevel: varchar("impact_level", { length: 10 }).notNull(), // low | medium | high
    reportedDate: date("reported_date").notNull(),
    resolvedDate: date("resolved_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("trade_barriers_country_idx").on(t.countryId)],
);
