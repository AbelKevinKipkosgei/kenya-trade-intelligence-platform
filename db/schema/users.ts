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
import { exporters } from "./exporters";

/**
 * User roles for role-based access control (RBAC).
 * - public: Default role for browsing (limited access)
 * - exporter: Kenyan exporters with full access to market intelligence
 * - officer: Government trade officials (requires domain verification or admin approval)
 * - admin: Platform administrators with full access
 */
export type UserRole = "public" | "exporter" | "officer" | "admin";

/**
 * Core users table with authentication credentials and role.
 * Passwords are hashed with bcrypt before storage.
 * Email verification and account status control access.
 */
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 200 }).notNull().unique(),
    fullName: varchar("full_name", { length: 200 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 20 }).$type<UserRole>().notNull().default("public"),
    emailVerified: boolean("email_verified").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("users_email_idx").on(t.email), index("users_role_idx").on(t.role)],
);

/**
 * Extended user profile data, role-specific.
 * For exporters: business details, sectors, and capacity.
 * For officers: agency affiliation and jurisdiction level.
 */
export const userProfiles = pgTable(
  "user_profiles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),

    // Exporter-specific fields
    exporterId: integer("exporter_id").references(() => exporters.id),
    businessRegistrationNumber: varchar("business_registration_number", { length: 100 }),
    businessType: varchar("business_type", { length: 50 }), // manufacturer | trader | cooperative | sme
    primarySectorId: integer("primary_sector_id").references(() => sectors.id),
    countiesOfOperation: jsonb("counties_of_operation").$type<number[]>(), // Array of county IDs

    // Officer-specific fields
    agencyId: integer("agency_id").references(() => agencies.id),
    department: varchar("department", { length: 200 }),
    officerLevel: varchar("officer_level", { length: 50 }), // county | national | regional

    // Common fields
    bio: text("bio"),
    avatarUrl: varchar("avatar_url", { length: 500 }),
    notificationPreferences: jsonb("notification_preferences").$type<{
      email?: boolean;
      inApp?: boolean;
      frequency?: "realtime" | "daily" | "weekly";
    }>(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("user_profiles_user_idx").on(t.userId),
    index("user_profiles_exporter_idx").on(t.exporterId),
    index("user_profiles_agency_idx").on(t.agencyId),
  ],
);

/**
 * User watchlists for tracking products, markets, opportunities, etc.
 * Each user can have multiple watchlists (e.g., "My Targets", "Q4 Markets").
 */
export const watchlists = pgTable(
  "watchlists",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("watchlists_user_idx").on(t.userId)],
);

/**
 * Items tracked in a watchlist.
 * Polymorphic design: itemType determines what itemId references.
 * - product: references products table
 * - country: references countries table (market tracking)
 * - opportunity: virtual (product+country combination)
 * - barrier: references trade_barriers table
 * - exporter: references exporters table
 */
export const watchlistItems = pgTable(
  "watchlist_items",
  {
    id: serial("id").primaryKey(),
    watchlistId: integer("watchlist_id")
      .notNull()
      .references(() => watchlists.id, { onDelete: "cascade" }),
    itemType: varchar("item_type", { length: 40 }).notNull(), // product | country | opportunity | barrier | exporter
    itemId: integer("item_id").notNull(), // Foreign key to respective table

    // Denormalized for quick display without joins
    itemName: varchar("item_name", { length: 300 }).notNull(),
    itemMeta: jsonb("item_meta").$type<{
      hsCode?: string;
      iso3?: string;
      productId?: number;
      countryId?: number;
      sectorName?: string;
      [key: string]: any;
    }>(), // Additional context (HS code, ISO code, etc.)

    notes: text("notes"),
    alertsEnabled: boolean("alerts_enabled").default(true).notNull(),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (t) => [
    index("watchlist_items_watchlist_idx").on(t.watchlistId),
    index("watchlist_items_type_idx").on(t.itemType),
    index("watchlist_items_item_idx").on(t.itemType, t.itemId),
  ],
);
