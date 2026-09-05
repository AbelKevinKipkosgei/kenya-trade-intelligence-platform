import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

/** Minimal role scaffold: public visitors, verified exporters, and officers. */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // public | exporter | officer | admin
  organization: varchar("organization", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
