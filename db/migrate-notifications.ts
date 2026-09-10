import "dotenv/config";
import { db } from "./client";
import { sql } from "drizzle-orm";

/**
 * Migration script to add notifications table
 * Run with: npx tsx db/migrate-notifications.ts
 */
async function migrate() {
  console.log("Creating notifications table...");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(40) NOT NULL,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      related_item_type VARCHAR(40),
      related_item_id INTEGER,
      metadata JSONB,
      is_read BOOLEAN NOT NULL DEFAULT false,
      read_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  console.log("Creating indexes...");

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON notifications(user_id, is_read);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS notifications_created_idx ON notifications(created_at);
  `);

  console.log("✓ Notifications table created successfully");
}

migrate()
  .then(() => {
    console.log("Migration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
