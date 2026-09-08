import { eq } from "drizzle-orm";
import "./load-env";
import { db, pool } from "../client";
import { products } from "../schema";
import { HS6_CODES_BY_CHAPTER } from "./hs6-reference";

/**
 * Corrects products.description to match what each product's real HS-6
 * code actually is. The earlier HS-code backfill (backfill-real-hs-codes.ts)
 * deliberately kept the old synthetic per-sector description ("{chapter
 * title} – {name picked from a small fixed pool}") rather than swap in the
 * real official one, reasoning that the official text would be too
 * technical. In practice this meant the code became real but the
 * description stayed essentially arbitrary relative to it — e.g. HS
 * 030222 (really "plaice, fresh or chilled") showing "Frozen Tilapia",
 * with the same description text repeating across many unrelated real
 * codes since the name pool per sector is small. Products with a
 * synthetic fallback code (chapter ran out of real codes) are left as-is
 * — there's no authoritative description to source for a non-real code.
 */
const CODE_TO_DESCRIPTION = new Map<string, string>();
for (const entries of Object.values(HS6_CODES_BY_CHAPTER)) {
  for (const { code, description } of entries) {
    CODE_TO_DESCRIPTION.set(code, description);
  }
}

async function main() {
  const rows = await db.select({ id: products.id, hsCode: products.hsCode, description: products.description }).from(products);
  console.log(`Checking ${rows.length} products...`);

  let updated = 0;
  let noRealDescription = 0;
  let alreadyCorrect = 0;

  for (const row of rows) {
    const realDescription = CODE_TO_DESCRIPTION.get(row.hsCode);
    if (!realDescription) {
      noRealDescription++;
      continue;
    }
    if (realDescription === row.description) {
      alreadyCorrect++;
      continue;
    }
    await db.update(products).set({ description: realDescription }).where(eq(products.id, row.id));
    updated++;
  }

  console.log(`Updated ${updated}, already correct ${alreadyCorrect}, no real code to source from ${noRealDescription}.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
