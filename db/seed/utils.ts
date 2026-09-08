import { pool } from "../client";

/** Scale factor for generated volumes, so the dataset size is tunable. */
export const SEED_SCALE = Number(process.env.SEED_SCALE ?? "1");

/**
 * Neon's project storage cap is 512 MB (hit in practice — see
 * `throttle_or_fail_extension` in Neon's error). Stop generating well
 * before that so a batch insert never fails mid-transaction; the gap
 * covers index growth and a safety margin against overshoot between
 * size checks.
 */
export const SEED_SIZE_LIMIT_BYTES = Number(process.env.SEED_SIZE_LIMIT_MB ?? "480") * 1024 * 1024;

export const seedStopState = { stopped: false };

/**
 * Checks live database size against SEED_SIZE_LIMIT_BYTES and latches
 * `seedStopState.stopped` once it's reached. Checked after every batch
 * insert (see `batchInsert` below) so generation unwinds cleanly instead
 * of risking an insert that overflows Neon's project size limit.
 */
export async function checkSizeLimit(): Promise<boolean> {
  if (seedStopState.stopped) return true;
  const res = await pool.query("select pg_database_size(current_database()) as bytes");
  const bytes = Number(res.rows[0].bytes);
  if (bytes >= SEED_SIZE_LIMIT_BYTES) {
    seedStopState.stopped = true;
    console.log(
      `  Reached size limit: ${(bytes / 1024 / 1024).toFixed(1)} MB >= ${(SEED_SIZE_LIMIT_BYTES / 1024 / 1024).toFixed(0)} MB target. Stopping further inserts.`,
    );
  }
  return seedStopState.stopped;
}

/** Runs `insertFn` over `rows` in chunks, stopping early once the size limit is hit. */
export async function batchInsert<T>(
  label: string,
  rows: T[],
  batchSize: number,
  insertFn: (batch: T[]) => Promise<unknown>,
): Promise<number> {
  let inserted = 0;
  const logEvery = Math.max(batchSize * 20, 20000);
  for (let i = 0; i < rows.length; i += batchSize) {
    if (seedStopState.stopped) break;
    const batch = rows.slice(i, i + batchSize);
    await insertFn(batch);
    inserted += batch.length;
    if (inserted % logEvery < batchSize || inserted === rows.length) {
      console.log(`  ${label}: ${inserted.toLocaleString()} / ${rows.length.toLocaleString()}`);
    }
    await checkSizeLimit();
  }
  return inserted;
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, decimals = 2): number {
  const value = Math.random() * (max - min) + min;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Uniform-random date between two ISO date strings (inclusive of start, exclusive of end). */
export function randomDate(startIso: string, endIso: string): Date {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return new Date(start + Math.random() * (end - start));
}
