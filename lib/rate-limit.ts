type Bucket = { count: number; windowStart: number };

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const MAX_PER_MINUTE = 10;
const MAX_PER_HOUR = 60;

const minuteBuckets = new Map<string, Bucket>();
const hourBuckets = new Map<string, Bucket>();

function checkBucket(map: Map<string, Bucket>, key: string, windowMs: number, max: number): boolean {
  const now = Date.now();
  const bucket = map.get(key);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    map.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

/**
 * In-memory sliding-window rate limit keyed by client identifier (IP).
 * Bounds worst-case API cost exposure on a public, unauthenticated route.
 * Resets on process restart and isn't shared across instances — fine for
 * a single self-hosted Node process; move to a Postgres- or Redis-backed
 * limiter before running this as multiple instances.
 */
export function checkRateLimit(key: string): { allowed: boolean; reason?: string } {
  if (!checkBucket(minuteBuckets, key, MINUTE_MS, MAX_PER_MINUTE)) {
    return { allowed: false, reason: `Rate limit exceeded: max ${MAX_PER_MINUTE} requests per minute.` };
  }
  if (!checkBucket(hourBuckets, key, HOUR_MS, MAX_PER_HOUR)) {
    return { allowed: false, reason: `Rate limit exceeded: max ${MAX_PER_HOUR} requests per hour.` };
  }
  return { allowed: true };
}

// Periodic cleanup so one-off visitors don't grow these maps forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of minuteBuckets) {
    if (now - bucket.windowStart >= MINUTE_MS) minuteBuckets.delete(key);
  }
  for (const [key, bucket] of hourBuckets) {
    if (now - bucket.windowStart >= HOUR_MS) hourBuckets.delete(key);
  }
}, HOUR_MS).unref();

/** Best-effort client identifier from standard proxy headers; falls back for direct/local connections. */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
