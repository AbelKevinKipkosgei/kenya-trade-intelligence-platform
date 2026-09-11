import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, pool } from "./client";

/** Create the tariff snapshots used by notification detection. */
async function migrateTariffHistory() {
  console.log("Creating tariff rate snapshots table...");

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tariff_rate_snapshots (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
        rate_type VARCHAR(20) NOT NULL,
        rate_percent NUMERIC(6, 3) NOT NULL,
        rate_source VARCHAR(20) NOT NULL,
        observed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT tariff_rate_snapshots_unique
          UNIQUE (product_id, country_id, rate_type)
      );
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS tariff_rate_snapshots_country_idx
      ON tariff_rate_snapshots(country_id);
    `);

    console.log("Tariff rate snapshots table created successfully");
  } finally {
    await pool.end();
  }
}

migrateTariffHistory()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Tariff history migration failed:", error);
    process.exit(1);
  });