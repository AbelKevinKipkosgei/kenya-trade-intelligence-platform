/** Runs `insertFn` over `rows` in chunks, logging progress periodically. */
export async function batchInsert<T>(
  label: string,
  rows: T[],
  batchSize: number,
  insertFn: (batch: T[]) => Promise<unknown>,
): Promise<number> {
  let inserted = 0;
  const logEvery = Math.max(batchSize * 20, 20000);
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await insertFn(batch);
    inserted += batch.length;
    if (inserted % logEvery < batchSize || inserted === rows.length) {
      console.log(`  ${label}: ${inserted.toLocaleString()} / ${rows.length.toLocaleString()}`);
    }
  }
  return inserted;
}

/** Scale factor for generated volumes, so the dataset size is tunable. */
export const SEED_SCALE = Number(process.env.SEED_SCALE ?? "1");

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
