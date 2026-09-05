import { setDefaultResultOrder } from "node:dns";
import { setDefaultAutoSelectFamily } from "node:net";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// This environment (WSL2) has no real IPv6 route to Neon, but that alone
// isn't the whole story: setDefaultResultOrder only changes DNS lookup
// *order*, not whether Node tries other addresses. Since Node 18, outbound
// connections use Happy Eyeballs (autoSelectFamily) — if the first (IPv4)
// attempt hasn't connected within ~250ms, Node races a parallel attempt on
// the next resolved address (IPv6) too. Under any latency blip that pushes
// the IPv4 attempt past that window, the IPv6 attempts join in, fail fast
// with ENETUNREACH, and can starve/compete with the still-pending IPv4
// attempt — surfacing as an AggregateError mixing one ETIMEDOUT with three
// ENETUNREACH, deep in an unrelated page. Disabling auto-family-selection
// makes Node try addresses strictly in dns.lookup order (IPv4 first, per
// setDefaultResultOrder below) with the full connection timeout, instead
// of racing doomed IPv6 attempts into the mix.
setDefaultAutoSelectFamily(false);
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
