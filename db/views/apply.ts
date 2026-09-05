import "../seed/load-env";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { pool } from "../client";

const here = dirname(fileURLToPath(import.meta.url));

async function main() {
  const sql = readFileSync(join(here, "bi-views.sql"), "utf-8");
  await pool.query(sql);
  console.log(
    "BI views created/updated: vw_trade_transactions, vw_market_opportunity, vw_tariffs, vw_trade_barriers, vw_procedures, vw_exporters",
  );
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
