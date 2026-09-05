import "../seed/load-env";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { pool } from "../client";

const here = dirname(fileURLToPath(import.meta.url));

async function main() {
  const sql = readFileSync(join(here, "compute-opportunity-scores.sql"), "utf-8");
  console.log("Computing market_opportunity_scores from real trade data...");
  const start = Date.now();

  // Separate, auto-committed statement — see the note at the top of the
  // .sql file for why this can't be bundled into the same transaction as
  // the INSERT that follows.
  await pool.query("TRUNCATE TABLE market_opportunity_scores RESTART IDENTITY");
  await pool.query(sql);
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM market_opportunity_scores");
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Computed ${rows[0].count.toLocaleString()} scores in ${elapsed}s.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
