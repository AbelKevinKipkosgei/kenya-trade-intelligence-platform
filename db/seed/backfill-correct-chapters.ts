import { eq } from "drizzle-orm";
import "./load-env";
import { db, pool } from "../client";
import { products } from "../schema";
import { NAME_TO_CHAPTER } from "./reference-data";
import { HS6_CODES_BY_CHAPTER } from "./hs6-reference";

/** Retries a query a few times on transient connection drops — this
 * script makes many sequential round trips against Neon, and a mid-run
 * disconnect otherwise takes the whole run down with it. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr;
}

/**
 * Corrects every product whose HS chapter doesn't match what its product
 * name actually is — e.g. "Baby Corn" (a vegetable, chapter 07) ending up
 * under chapter 06 (live plants/cut flowers) purely because the original
 * seed picked a random chapter within the sector independently of which
 * name it then picked. This is a broader, more accurate successor to
 * backfill-real-hs-codes.ts, which only asked "is there a real code left
 * in this chapter" without checking whether the product belonged in that
 * chapter in the first place.
 *
 * Reassigns every product covered by NAME_TO_CHAPTER to a real code from
 * its *correct* chapter (freeing up real codes in the wrong chapter for
 * whatever, if anything, actually belongs there), with the description
 * sourced from that real code's official UN Comtrade text. Falls back to
 * a synthetic-but-correct-chapter code only if the correct chapter's real
 * codes are exhausted — same graceful-degradation pattern as before, just
 * now landing in the right chapter instead of an arbitrary one.
 */
async function main() {
  const rows = await db
    .select({ id: products.id, hsCode: products.hsCode, description: products.description })
    .from(products);

  const reserved = new Set(rows.map((r) => r.hsCode));
  const finalCode = new Map<number, string>();
  const finalDescription = new Map<number, string>();
  let reassigned = 0;
  let alreadyCorrect = 0;
  let notCovered = 0;
  let syntheticFallback = 0;

  for (const row of rows) {
    const name = row.description.split(" – ")[1]?.trim();
    const correctChapter = name ? NAME_TO_CHAPTER[name] : undefined;
    if (!correctChapter) {
      notCovered++;
      continue;
    }

    const currentChapter = row.hsCode.slice(0, 2);
    if (currentChapter === correctChapter && HS6_CODES_BY_CHAPTER[correctChapter]?.some((c) => c.code === row.hsCode)) {
      alreadyCorrect++;
      continue;
    }

    const available = (HS6_CODES_BY_CHAPTER[correctChapter] ?? []).filter((c) => !reserved.has(c.code));
    if (available.length > 0) {
      const chosen = available[Math.floor(Math.random() * available.length)];
      reserved.delete(row.hsCode);
      reserved.add(chosen.code);
      finalCode.set(row.id, chosen.code);
      finalDescription.set(row.id, chosen.description);
      reassigned++;
      continue;
    }

    // Correct chapter's real codes are exhausted — synthetic fallback,
    // but at least in the *right* chapter this time.
    let synthetic: string | null = null;
    for (let attempts = 0; attempts < 50; attempts++) {
      const heading = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0");
      const subheading = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0");
      const candidate = `${correctChapter}${heading}${subheading}`;
      if (!reserved.has(candidate)) {
        synthetic = candidate;
        break;
      }
    }
    if (synthetic) {
      reserved.delete(row.hsCode);
      reserved.add(synthetic);
      finalCode.set(row.id, synthetic);
      syntheticFallback++;
    }
  }

  console.log(
    `${reassigned} reassigned to a real code in the correct chapter, ${syntheticFallback} on a synthetic fallback (correct chapter exhausted), ${alreadyCorrect} already correct, ${notCovered} not covered by NAME_TO_CHAPTER (left as-is).`,
  );

  const toUpdate = [...finalCode.keys()];
  console.log(`Phase 1: clearing ${toUpdate.length} rows to temp placeholders...`);
  for (const id of toUpdate) {
    await withRetry(() => db.update(products).set({ hsCode: `TC${id}` }).where(eq(products.id, id)));
  }

  console.log("Phase 2: writing final codes and descriptions...");
  for (const id of toUpdate) {
    const update: { hsCode: string; description?: string } = { hsCode: finalCode.get(id)! };
    if (finalDescription.has(id)) update.description = finalDescription.get(id)!;
    await withRetry(() => db.update(products).set(update).where(eq(products.id, id)));
  }

  console.log("Done.");
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
