import { existsSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import "./load-env";
import { db, pool } from "../client";
import { ports } from "../schema";
import { PORT_TYPE_SHARE, WITHIN_TYPE_SHARE } from "./04-transactions";

/**
 * Reassigns port_id on every existing trade_transactions row to match the
 * realistic per-port shares in 04-transactions.ts, instead of the old
 * uniform-within-type random pick that made every port of the same type
 * (e.g. all 6 land border posts, or both seaports) converge to nearly
 * identical aggregate SUM(value_usd) over enough rows — a transaction's
 * value is drawn independently of its port, so a uniform pick necessarily
 * spreads value evenly too. It also never assigned the "icd" port type at
 * all, so Embakasi and Naivasha ICDs had zero transactions.
 *
 * Batched, not a single set-based UPDATE: this project's Neon database
 * sits within ~1% of its 512MB hard cap, and a single UPDATE touching all
 * 2.7M rows creates that many dead row versions (Postgres MVCC never
 * overwrites in place) before anything can be reclaimed — confirmed live,
 * it fails outright, and even a 20,000-row attempt failed the same way.
 * So this processes small batches, VACUUMs after each one (empirically
 * this Neon setup actually shrinks pg_database_size afterward, not just
 * marks space reusable), and checks size before continuing. A checkpoint
 * file makes it resumable: if it stops early because it got too close to
 * the cap, re-running this same command continues from where it left off
 * instead of restarting.
 */
const BATCH_SIZE = 50_000;
const PROJECT_SIZE_LIMIT_MB = 512;
const SAFETY_MARGIN_MB = 20;
const CHECKPOINT_FILE = join(tmpdir(), "ktip-port-backfill-checkpoint.json");

async function dbSizeMb(): Promise<number> {
  const r = await pool.query("select pg_database_size(current_database())/1024.0/1024 as mb");
  return Number(r.rows[0].mb);
}

function loadCheckpoint(): number {
  if (!existsSync(CHECKPOINT_FILE)) return 0;
  return JSON.parse(readFileSync(CHECKPOINT_FILE, "utf-8")).lastId ?? 0;
}

function saveCheckpoint(lastId: number) {
  writeFileSync(CHECKPOINT_FILE, JSON.stringify({ lastId }));
}

async function main() {
  const portRows = await db.select({ id: ports.id, name: ports.name, type: ports.type }).from(ports);

  // Flatten to one probability per port: its type's overall share times
  // its share within that type, then build cumulative thresholds so one
  // random() draw in [0, 1) maps to exactly one port.
  let cumulative = 0;
  const thresholds: { upTo: number; portId: number; label: string }[] = [];
  for (const port of portRows) {
    const typeShare = PORT_TYPE_SHARE[port.type as keyof typeof PORT_TYPE_SHARE];
    const withinShare = WITHIN_TYPE_SHARE[port.type]?.[port.name];
    if (!typeShare || !withinShare) {
      throw new Error(`No weight configured for port "${port.name}" (type ${port.type}) — add it to WITHIN_TYPE_SHARE first.`);
    }
    cumulative += typeShare * withinShare;
    thresholds.push({ upTo: cumulative, portId: port.id, label: port.name });
  }
  if (Math.abs(cumulative - 1) > 0.0001) {
    throw new Error(`Port weights sum to ${cumulative}, not 1 — check PORT_TYPE_SHARE/WITHIN_TYPE_SHARE.`);
  }

  const caseLines = thresholds
    .map((t, i) => (i === thresholds.length - 1 ? `ELSE ${t.portId} -- ${t.label}` : `WHEN r < ${t.upTo} THEN ${t.portId} -- ${t.label}`))
    .join("\n          ");

  const { rows: maxRows } = await pool.query("select max(id) as max_id from trade_transactions");
  const maxId = Number(maxRows[0].max_id);
  let lastId = loadCheckpoint();
  console.log(`Resuming from id > ${lastId} (max id: ${maxId})`);

  while (lastId < maxId) {
    const sizeBefore = await dbSizeMb();
    if (sizeBefore > PROJECT_SIZE_LIMIT_MB - SAFETY_MARGIN_MB) {
      console.log(
        `Size ${sizeBefore.toFixed(1)}MB is within ${SAFETY_MARGIN_MB}MB of the ${PROJECT_SIZE_LIMIT_MB}MB cap — stopping here. Re-run this script later to continue from id > ${lastId}.`,
      );
      break;
    }

    const result = await pool.query(
      `
      UPDATE trade_transactions
      SET port_id = (
        CASE
          ${caseLines}
        END
      )
      FROM (SELECT id, random() AS r FROM trade_transactions WHERE id > $1 ORDER BY id LIMIT $2) sub
      WHERE trade_transactions.id = sub.id
      RETURNING trade_transactions.id
      `,
      [lastId, BATCH_SIZE],
    );

    if (result.rowCount === 0) break;
    lastId = Math.max(...result.rows.map((r) => r.id));
    saveCheckpoint(lastId);

    await pool.query("VACUUM trade_transactions");
    const sizeAfter = await dbSizeMb();
    console.log(`Updated through id ${lastId} (${result.rowCount} rows this batch). DB size now ${sizeAfter.toFixed(1)}MB.`);
  }

  console.log(lastId >= maxId ? "All rows reassigned." : "Stopped early — re-run this script to continue.");
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
