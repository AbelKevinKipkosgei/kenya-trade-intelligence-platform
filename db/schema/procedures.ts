import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { agencies, sectors } from "./core";

export type ProcedureStep = {
  order: number;
  title: string;
  description: string;
  agencyCode?: string;
  documentsRequired?: string[];
  estimatedDays?: number;
  fees?: string;
};

/**
 * Step-by-step "how do I get started" guidance — the piece that was
 * missing from the schema: everything else here is quantitative trade
 * data, but a new importer/exporter also needs the fragmented procedural
 * knowledge (which agency, which form, in what order) centralized in one
 * place. sectorId is nullable — a procedure with no sector applies
 * generally (e.g. KRA PIN registration).
 */
export const procedures = pgTable(
  "procedures",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    category: varchar("category", { length: 20 }).notNull(), // import | export | certification | licensing | customs
    sectorId: integer("sector_id").references(() => sectors.id),
    summary: text("summary").notNull(),
    steps: jsonb("steps").$type<ProcedureStep[]>().notNull(),
    leadAgencyId: integer("lead_agency_id")
      .notNull()
      .references(() => agencies.id),
    estimatedTotalDays: integer("estimated_total_days"),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  },
  (t) => [
    index("procedures_category_idx").on(t.category),
    index("procedures_sector_idx").on(t.sectorId),
  ],
);
