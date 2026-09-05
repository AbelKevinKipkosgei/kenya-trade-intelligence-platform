import "./load-env";
import { pool, db } from "../client";
import { sectors, agencies } from "../schema";
import { ensureKephisAgency, seedProcedures } from "./06-procedures";

async function main() {
  const sectorRows = await db.select({ id: sectors.id, name: sectors.name }).from(sectors);
  const sectorIdByName = new Map(sectorRows.map((r) => [r.name, r.id]));

  const agencyRows = await db.select({ id: agencies.id, code: agencies.code }).from(agencies);
  const agencyIdByCode = new Map(agencyRows.map((r) => [r.code, r.id]));

  await ensureKephisAgency(agencyIdByCode);
  const count = await seedProcedures(sectorIdByName, agencyIdByCode);
  console.log(`Backfilled ${count} procedures.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
