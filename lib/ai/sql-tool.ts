import { pool } from "@/db/client";

const MAX_ROWS = 200;
const STATEMENT_TIMEOUT_MS = 8000;

// Blocks any statement that isn't a plain read. This is a first-pass
// filter, not the enforcement boundary — the real guarantee is the
// READ ONLY transaction below, which Postgres itself rejects writes
// inside regardless of what slips past this regex.
const FORBIDDEN = /\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|copy|call|do|vacuum|reindex|refresh|lock|merge|comment|listen|notify|set\s+role|pg_read_|pg_ls_|pg_write_|dblink)\b/i;
const ALLOWED_START = /^\s*(select|with)\b/i;

export class UnsafeQueryError extends Error {}

/**
 * Runs a single read-only SQL statement and returns up to MAX_ROWS rows.
 * Defense in depth: a regex prefilter rejects obvious write/DDL/admin
 * statements, then the query runs inside `SET TRANSACTION READ ONLY`
 * (Postgres itself refuses any write in that transaction, independent of
 * the prefilter or the connection's role grants) with a statement
 * timeout, wrapped so no query can return more than MAX_ROWS rows.
 */
export async function runReadOnlyQuery(sql: string): Promise<{ rows: unknown[]; rowCount: number; truncated: boolean }> {
  const trimmed = sql.trim().replace(/;+\s*$/, "");

  if (trimmed.includes(";")) {
    throw new UnsafeQueryError("Only a single statement is allowed (no semicolons inside the query).");
  }
  if (!ALLOWED_START.test(trimmed)) {
    throw new UnsafeQueryError("Only SELECT (or WITH ... SELECT) statements are allowed.");
  }
  if (FORBIDDEN.test(trimmed)) {
    throw new UnsafeQueryError("Query contains a disallowed keyword. Only read-only SELECTs are permitted.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    await client.query(`SET LOCAL statement_timeout = ${STATEMENT_TIMEOUT_MS}`);
    // Wrap so the row cap holds regardless of whether the model's own
    // query included a LIMIT — an inner LIMIT is still respected first.
    const wrapped = `SELECT * FROM (${trimmed}) AS _query LIMIT ${MAX_ROWS + 1}`;
    const result = await client.query(wrapped);
    await client.query("COMMIT");

    const truncated = result.rows.length > MAX_ROWS;
    return {
      rows: truncated ? result.rows.slice(0, MAX_ROWS) : result.rows,
      rowCount: truncated ? MAX_ROWS : result.rows.length,
      truncated,
    };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
