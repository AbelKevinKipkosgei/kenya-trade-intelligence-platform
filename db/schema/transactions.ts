import {
  pgTable,
  bigserial,
  integer,
  varchar,
  numeric,
  date,
  index,
} from "drizzle-orm/pg-core";
import { agencies, countries, ports } from "./core";
import { products } from "./trade";

/**
 * The core fact table: one row per product x partner country x month x
 * flow direction. This is the table InsightGrid will query most heavily,
 * so it stays narrow and well-indexed rather than wide/denormalized.
 */
export const tradeTransactions = pgTable(
  "trade_transactions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    transactionDate: date("transaction_date").notNull(),
    flowType: varchar("flow_type", { length: 10 }).notNull(), // export | import
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id),
    portId: integer("port_id").references(() => ports.id),
    valueUsd: numeric("value_usd", { precision: 16, scale: 2 }).notNull(),
    quantity: numeric("quantity", { precision: 16, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 20 }).notNull(),
    sourceAgencyId: integer("source_agency_id")
      .notNull()
      .references(() => agencies.id),
  },
  (t) => [
    index("tx_product_country_date_idx").on(
      t.productId,
      t.countryId,
      t.transactionDate,
    ),
    index("tx_date_flow_idx").on(t.transactionDate, t.flowType),
    index("tx_country_idx").on(t.countryId),
  ],
);
