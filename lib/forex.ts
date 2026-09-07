/**
 * Live USD/KES rate for the Landed Cost Estimator — fetched, not hardcoded,
 * since a fixed conversion figure would silently drift stale. Free, no-key
 * API (backed by exchangerate-api.com's free tier, rates updated daily).
 * Cached for an hour via Next's fetch cache so concurrent page views don't
 * each trigger their own external call.
 */
export async function getUsdToKesRate(): Promise<number | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.KES;
    return typeof rate === "number" ? rate : null;
  } catch {
    return null;
  }
}
