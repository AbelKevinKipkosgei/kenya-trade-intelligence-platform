import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { sectors, countries } from "./core";

/**
 * A followed sector or country for alerting purposes — one row per follow,
 * with exactly one of sectorId/countryId set. The existing database column is
 * retained for compatibility, but it stores the local users.id value as text.
 */
export const userInterests = pgTable("user_interests", {
  id: serial("id").primaryKey(),
  authUserId: varchar("clerk_user_id", { length: 64 }).notNull(),
  sectorId: integer("sector_id").references(() => sectors.id),
  countryId: integer("country_id").references(() => countries.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
