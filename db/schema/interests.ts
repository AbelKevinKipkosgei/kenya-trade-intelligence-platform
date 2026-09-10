import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { sectors, countries } from "./core";

/**
 * A followed sector or country for alerting purposes — one row per follow,
 * with exactly one of sectorId/countryId set. Keyed directly by Clerk's own
 * user ID string rather than a foreign key into `users`, since that table
 * is still an unwired scaffold (see users.ts) and this feature doesn't need
 * a full synced user profile, just "who to notify."
 */
export const userInterests = pgTable("user_interests", {
  id: serial("id").primaryKey(),
  clerkUserId: varchar("clerk_user_id", { length: 64 }).notNull(),
  sectorId: integer("sector_id").references(() => sectors.id),
  countryId: integer("country_id").references(() => countries.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
