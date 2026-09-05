import "./load-env";
import { pool, db } from "../client";
import { products, countries, agencies } from "../schema";
import { seedTradeBarriers } from "./07-barriers";

async function main() {
  const productRows = await db
    .select({ id: products.id, hsCode: products.hsCode, description: products.description })
    .from(products);

  const countryRows = await db
    .select({ id: countries.id, iso3: countries.iso3, name: countries.name })
    .from(countries);
  const countryIdByIso3 = new Map(countryRows.map((r) => [r.iso3, r.id]));
  const countryNameById = new Map(countryRows.map((r) => [r.id, r.name]));

  const agencyRows = await db.select({ id: agencies.id, code: agencies.code }).from(agencies);
  const agencyIdByCode = new Map(agencyRows.map((r) => [r.code, r.id]));

  const count = await seedTradeBarriers(productRows, countryIdByIso3, countryNameById, agencyIdByCode);
  console.log(`Backfilled ${count} trade_barriers.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
