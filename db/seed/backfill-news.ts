import "./load-env";
import { pool, db } from "../client";
import { sectors, countries, products } from "../schema";
import { seedNews } from "./05-news";

async function main() {
  const sectorRows = await db.select({ id: sectors.id, name: sectors.name }).from(sectors);
  const sectorIdByName = new Map(sectorRows.map((r) => [r.name, r.id]));

  const countryRows = await db
    .select({ id: countries.id, iso3: countries.iso3, name: countries.name })
    .from(countries);
  const countryIdByIso3 = new Map(countryRows.map((r) => [r.iso3, r.id]));
  const countryNameById = new Map(countryRows.map((r) => [r.id, r.name]));

  const productRows = await db
    .select({ id: products.id, sectorId: products.sectorId })
    .from(products);
  const productsBySector = new Map<number, { id: number }[]>();
  for (const p of productRows) {
    if (!productsBySector.has(p.sectorId)) productsBySector.set(p.sectorId, []);
    productsBySector.get(p.sectorId)!.push({ id: p.id });
  }

  const count = await seedNews(sectorIdByName, countryIdByIso3, productsBySector, countryNameById);
  console.log(`Backfilled ${count} news_articles.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
