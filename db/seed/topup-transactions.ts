import "./load-env";
import { pool, db } from "../client";
import { products, countries, agencies, ports } from "../schema";
import { seedTransactionsAndScores } from "./04-transactions";

async function main() {
  console.log("Truncating trade_transactions and market_opportunity_scores...");
  await pool.query("TRUNCATE TABLE trade_transactions, market_opportunity_scores RESTART IDENTITY");

  const productRows = await db
    .select({ id: products.id, hsCode: products.hsCode, sectorId: products.sectorId, unit: products.unit })
    .from(products);

  const countryRows = await db.select({ id: countries.id, iso3: countries.iso3 }).from(countries);
  const countryIdByIso3 = new Map(countryRows.map((r) => [r.iso3, r.id]));

  const agencyRows = await db.select({ id: agencies.id, code: agencies.code }).from(agencies);
  const agencyIdByCode = new Map(agencyRows.map((r) => [r.code, r.id]));

  const portRows = await db.select({ id: ports.id, type: ports.type }).from(ports);

  const { txTotal, scoreTotal } = await seedTransactionsAndScores(
    productRows,
    countryIdByIso3,
    agencyIdByCode,
    portRows,
  );

  console.log(`Top-up complete: ${txTotal.toLocaleString()} trade_transactions, ${scoreTotal.toLocaleString()} market_opportunity_scores.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
