import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { agencies, counties, sectors } from "./core";
import { products } from "./trade";

/**
 * Kenyan Export Capacity Map: manufacturers/exporters that can be linked to
 * a Market Opportunity Engine result to answer "who can actually supply
 * this market".
 */
export const exporters = pgTable(
  "exporters",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    countyId: integer("county_id")
      .notNull()
      .references(() => counties.id),
    sectorId: integer("sector_id")
      .notNull()
      .references(() => sectors.id),
    primaryProductId: integer("primary_product_id")
      .notNull()
      .references(() => products.id),
    employeesCount: integer("employees_count").notNull(),
    annualCapacity: integer("annual_capacity").notNull(),
    capacityUnit: varchar("capacity_unit", { length: 20 }).notNull(),
    certifications: jsonb("certifications").$type<string[]>().notNull(),
    exportReady: boolean("export_ready").default(true).notNull(),
    contactEmail: varchar("contact_email", { length: 200 }),
    registeredWithAgencyId: integer("registered_with_agency_id").references(
      () => agencies.id,
    ),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("exporters_sector_idx").on(t.sectorId),
    index("exporters_county_idx").on(t.countyId),
    index("exporters_product_idx").on(t.primaryProductId),
  ],
);
