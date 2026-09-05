import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Kenyan state corporations / agencies that are the provenance ("source of
 * truth") for every fact recorded elsewhere in the schema. Every table that
 * holds a claim (a transaction, a tariff, a barrier) links back to one of
 * these so it stays traceable, per the KTIP concept doc's requirement that
 * scores/insights be explainable back to real data.
 */
export const agencies = pgTable("agencies", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  website: varchar("website", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  iso2: varchar("iso2", { length: 2 }).notNull().unique(),
  iso3: varchar("iso3", { length: 3 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  isEacMember: boolean("is_eac_member").default(false).notNull(),
  isComesaMember: boolean("is_comesa_member").default(false).notNull(),
});

export const sectors = pgTable("sectors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
});

export const counties = pgTable("counties", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  region: varchar("region", { length: 100 }).notNull(),
});

export const ports = pgTable("ports", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  type: varchar("type", { length: 30 }).notNull(), // seaport | airport | land_border | icd
  countyId: integer("county_id").references(() => counties.id),
});
