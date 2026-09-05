import "./load-env";
import { pool } from "../client";
import { seedCore } from "./01-core";
import { seedCatalog, seedAgreementMembers, seedTariffs } from "./02-catalog";
import { seedExporters } from "./03-exporters";
import { seedTransactionsAndScores } from "./04-transactions";
import { seedNews } from "./05-news";
import { ensureKephisAgency, seedProcedures } from "./06-procedures";
import { SEED_SCALE } from "./utils";

async function main() {
  const start = Date.now();
  console.log(`Starting KTIP mock data seed (SEED_SCALE=${SEED_SCALE})...\n`);

  const { agencyIdByCode, sectorIdByName, countryIdByIso3, countryNameById, countyIdByName, portRows } =
    await seedCore();
  await ensureKephisAgency(agencyIdByCode);

  const { insertedProducts, agreementIdByCode } = await seedCatalog(sectorIdByName);

  const productsBySector = new Map<number, { id: number }[]>();
  for (const p of insertedProducts) {
    if (!productsBySector.has(p.sectorId)) productsBySector.set(p.sectorId, []);
    productsBySector.get(p.sectorId)!.push({ id: p.id });
  }

  await seedAgreementMembers(countryIdByIso3, agreementIdByCode);
  const tariffCount = await seedTariffs(insertedProducts, countryIdByIso3, agreementIdByCode, agencyIdByCode);
  const exporterCount = await seedExporters(countyIdByName, sectorIdByName, productsBySector, agencyIdByCode);
  const { txTotal, scoreTotal } = await seedTransactionsAndScores(
    insertedProducts,
    countryIdByIso3,
    agencyIdByCode,
    portRows,
  );
  const newsCount = await seedNews(sectorIdByName, countryIdByIso3, productsBySector, countryNameById);
  const procedureCount = await seedProcedures(sectorIdByName, agencyIdByCode);

  const elapsedMin = ((Date.now() - start) / 60000).toFixed(1);
  console.log(`\nSeed complete in ${elapsedMin} min.`);
  console.log({
    products: insertedProducts.length,
    tariffs: tariffCount,
    exporters: exporterCount,
    tradeTransactions: txTotal,
    marketOpportunityScores: scoreTotal,
    newsArticles: newsCount,
    procedures: procedureCount,
  });

  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
