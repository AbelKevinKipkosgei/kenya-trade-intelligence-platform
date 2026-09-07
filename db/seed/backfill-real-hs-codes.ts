import { eq } from "drizzle-orm";
import "./load-env";
import { db, pool } from "../client";
import { products } from "../schema";
import { HS_CHAPTERS } from "./reference-data";
import { HS6_CODES_BY_CHAPTER } from "./hs6-reference";

/**
 * One-time correction for products seeded before real HS-6 codes were
 * sourced (see hs6-reference.ts) — the old scheme was chapter + two
 * random two-digit groups, real only at the 2-digit chapter level.
 * Foreign keys everywhere else reference products.id, not hsCode, so
 * this is a safe in-place UPDATE — no need to touch trade_transactions,
 * tariffs, exporters, or trade_barriers.
 *
 * Idempotent / resumable: an earlier run of this script crashed after
 * clearing rows to temp `TMP{id}` placeholders but before finishing the
 * final write, so a row's chapter can no longer always be read from its
 * own hsCode. Recovered instead from its description, which was
 * generated as "{chapter title} – {product name}" and never touched —
 * chapter titles are unique, so this reverse-maps cleanly.
 *
 * A few chapters (e.g. "06", "46") have more synthetic products than
 * real HS-6 subheadings actually exist — real chapter 06 has only 16,
 * for instance. For those leftover products, falls back to the
 * original chapter+random-4-digits scheme (still real at the 2-digit
 * chapter level, same as pre-backfill) rather than leaving them on a
 * placeholder value.
 *
 * Correctness note: to make the final set of codes provably unique
 * before writing anything, every row's current code is reserved up
 * front (including any leftover TMP/T placeholder from an earlier
 * partial run — they're unique by construction, so reserving them is
 * harmless), and only released back up if that row ends up getting a
 * different code. Writes then happen in two phases (clear everything to
 * a temp value, then set final values) purely to avoid write-ordering
 * dependencies against the UNIQUE constraint.
 */
const titleToChapter = new Map(HS_CHAPTERS.map((c) => [c.title, c.chapter]));

/** Retries a query a few times on transient connection drops — this script
 * makes thousands of sequential round trips against Neon, and a mid-run
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

function resolveChapter(hsCode: string, description: string): string | null {
  if (/^\d{6}$/.test(hsCode)) return hsCode.slice(0, 2);
  const title = description.split(" – ")[0];
  return titleToChapter.get(title) ?? null;
}

/** Same scheme the original (pre-real-code) seed used — a fallback for
 * chapters that have run out of real codes to hand out. */
function generateSyntheticCode(chapter: string, reserved: Set<string>): string | null {
  for (let attempts = 0; attempts < 50; attempts++) {
    const heading = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0");
    const subheading = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0");
    const code = `${chapter}${heading}${subheading}`;
    if (!reserved.has(code)) return code;
  }
  return null;
}

async function main() {
  const rows = await db.select({ id: products.id, hsCode: products.hsCode, description: products.description }).from(products);
  console.log(`Found ${rows.length} products to check.`);

  const reserved = new Set(rows.map((r) => r.hsCode));
  const finalCode = new Map<number, string>();
  let realCount = 0;
  let syntheticFallbackCount = 0;
  let unresolvable = 0;

  for (const row of rows) {
    const chapter = resolveChapter(row.hsCode, row.description);
    if (!chapter) {
      console.log(`  Could not resolve chapter for product ${row.id} (code ${row.hsCode}, desc "${row.description}") — leaving as-is.`);
      finalCode.set(row.id, row.hsCode);
      unresolvable++;
      continue;
    }
    const available = (HS6_CODES_BY_CHAPTER[chapter] ?? []).filter((c) => !reserved.has(c.code));
    if (available.length > 0) {
      const chosen = available[Math.floor(Math.random() * available.length)];
      reserved.delete(row.hsCode);
      reserved.add(chosen.code);
      finalCode.set(row.id, chosen.code);
      realCount++;
      continue;
    }
    // Chapter exhausted of real codes — fall back to a synthetic one
    // rather than leave the row on a placeholder.
    const synthetic = generateSyntheticCode(chapter, reserved);
    if (synthetic) {
      reserved.delete(row.hsCode);
      reserved.add(synthetic);
      finalCode.set(row.id, synthetic);
      syntheticFallbackCount++;
    } else {
      console.log(`  Could not find any free code (real or synthetic) for product ${row.id}, chapter ${chapter} — leaving as-is.`);
      finalCode.set(row.id, row.hsCode);
      unresolvable++;
    }
  }

  console.log(
    `${realCount} products got a real HS-6 code; ${syntheticFallbackCount} got a synthetic fallback (chapter exhausted); ${unresolvable} unresolvable.`,
  );

  console.log("Phase 1: clearing all rows to temp placeholders...");
  for (const row of rows) {
    await withRetry(() => db.update(products).set({ hsCode: `T${row.id}` }).where(eq(products.id, row.id)));
  }

  console.log("Phase 2: writing final codes...");
  for (const row of rows) {
    await withRetry(() => db.update(products).set({ hsCode: finalCode.get(row.id)! }).where(eq(products.id, row.id)));
  }

  console.log("Done.");
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
