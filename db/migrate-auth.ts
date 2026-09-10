import "dotenv/config";
import { sql } from "drizzle-orm";
import { db, pool } from "./client";

/**
 * Migration script to update users table and create user_profiles table
 * for the authentication system.
 */
async function migrateAuth() {
  console.log("Starting authentication schema migration...");

  try {
    // Check if users table exists and has old structure
    const existingUsers = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password_hash'
    `);

    if (!existingUsers.rows || existingUsers.rows.length === 0) {
      console.log("Updating users table structure...");

      // Add new columns to users table
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
      `);

      // Update role column to have default
      await db.execute(sql`
        ALTER TABLE users
        ALTER COLUMN role SET DEFAULT 'public';
      `);

      // Remove organization column if it exists (moved to user_profiles)
      await db.execute(sql`
        ALTER TABLE users
        DROP COLUMN IF EXISTS organization;
      `);

      console.log("✓ Users table updated");
    } else {
      console.log("✓ Users table already has auth columns");
    }

    // Check if user_profiles table exists
    const existingProfiles = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'user_profiles'
    `);

    if (!existingProfiles.rows || existingProfiles.rows.length === 0) {
      console.log("Creating user_profiles table...");

      await db.execute(sql`
        CREATE TABLE user_profiles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          exporter_id INTEGER REFERENCES exporters(id),
          business_registration_number VARCHAR(100),
          business_type VARCHAR(50),
          primary_sector_id INTEGER REFERENCES sectors(id),
          counties_of_operation JSONB,
          agency_id INTEGER REFERENCES agencies(id),
          department VARCHAR(200),
          officer_level VARCHAR(50),
          bio TEXT,
          avatar_url VARCHAR(500),
          notification_preferences JSONB,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      // Create indexes
      await db.execute(sql`
        CREATE INDEX user_profiles_user_idx ON user_profiles(user_id);
      `);

      await db.execute(sql`
        CREATE INDEX user_profiles_exporter_idx ON user_profiles(exporter_id);
      `);

      await db.execute(sql`
        CREATE INDEX user_profiles_agency_idx ON user_profiles(agency_id);
      `);

      console.log("✓ User profiles table created with indexes");
    } else {
      console.log("✓ User profiles table already exists");
    }

    // Create indexes on users table if they don't exist
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
    `);

    console.log("✓ User indexes created");

    console.log("\n✅ Authentication schema migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateAuth();
