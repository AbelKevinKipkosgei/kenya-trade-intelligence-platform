import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, pool } from "./client";

/**
 * Migration script to create watchlists and watchlist_items tables.
 */
async function migrateWatchlists() {
  console.log("Starting watchlist schema migration...");

  try {
    // Check if watchlists table exists
    const existingWatchlists = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'watchlists'
    `);

    if (!existingWatchlists.rows || existingWatchlists.rows.length === 0) {
      console.log("Creating watchlists table...");

      await db.execute(sql`
        CREATE TABLE watchlists (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          is_default BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      await db.execute(sql`
        CREATE INDEX watchlists_user_idx ON watchlists(user_id);
      `);

      console.log("✓ Watchlists table created");
    } else {
      console.log("✓ Watchlists table already exists");
    }

    // Check if watchlist_items table exists
    const existingItems = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'watchlist_items'
    `);

    if (!existingItems.rows || existingItems.rows.length === 0) {
      console.log("Creating watchlist_items table...");

      await db.execute(sql`
        CREATE TABLE watchlist_items (
          id SERIAL PRIMARY KEY,
          watchlist_id INTEGER NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
          item_type VARCHAR(40) NOT NULL,
          item_id INTEGER NOT NULL,
          item_name VARCHAR(300) NOT NULL,
          item_meta JSONB,
          notes TEXT,
          alerts_enabled BOOLEAN NOT NULL DEFAULT true,
          added_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      await db.execute(sql`
        CREATE INDEX watchlist_items_watchlist_idx ON watchlist_items(watchlist_id);
      `);

      await db.execute(sql`
        CREATE INDEX watchlist_items_type_idx ON watchlist_items(item_type);
      `);

      await db.execute(sql`
        CREATE INDEX watchlist_items_item_idx ON watchlist_items(item_type, item_id);
      `);

      console.log("✓ Watchlist items table created with indexes");
    } else {
      console.log("✓ Watchlist items table already exists");
    }

    console.log("\n✅ Watchlist schema migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateWatchlists();
