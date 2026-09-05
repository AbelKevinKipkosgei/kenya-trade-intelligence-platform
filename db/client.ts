import { setDefaultResultOrder } from "node:dns";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// This environment has no IPv6 route to Neon — every connection attempt
// was wasting its timeout budget on three IPv6 addresses that always fail
// with ENETUNREACH before ever trying the one IPv4 address that actually
// works, occasionally starving that last attempt and surfacing as random
// "Failed query" errors deep in unrelated pages. Skip straight to IPv4.
setDefaultResultOrder("ipv4first");

// Next.js dev mode (Fast Refresh / Turbopack HMR) re-executes this module on
// every file save. Without this guard, each reload creates a brand-new pg
// Pool without closing the previous one, leaking connections until Neon's
// connection limit is hit — which then shows up as intermittent, seemingly
// unrelated "Failed query" errors deep into a dev session. Stashing the
// pool on globalThis survives HMR reloads within the same Node process.
// Standalone scripts (seed/eval) get a fresh globalThis each run, so
// they're unaffected and still create+close their own pool as before.
const globalForPool = globalThis as unknown as { pgPool?: Pool };

export const pool = globalForPool.pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForPool.pgPool = pool;
}

export const db = drizzle(pool, { schema });
