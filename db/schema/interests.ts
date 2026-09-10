import { pgTable, serial, integer, timestamp, index } from "drizzle-orm/pg-core";
import { sectors, countries } from "./core";
import { users } from "./users";

/**
 * A followed sector or country for alerting purposes — one row per follow,
 * with exactly one of sectorId/countryId set. References the real `users`
 * table (NextAuth's own user store, see lib/auth.ts) rather than an
 * external identity string, now that a proper local user table exists.
 */
export const userInterests = pgTable(
  "user_interests",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sectorId: integer("sector_id").references(() => sectors.id),
    countryId: integer("country_id").references(() => countries.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("user_interests_user_idx").on(t.userId)],
);
