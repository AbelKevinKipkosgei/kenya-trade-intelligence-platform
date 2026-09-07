import { and, eq } from "drizzle-orm";
import countriesData from "world-countries";
import "../seed/load-env";
import { db, pool } from "../client";
import { products, countries, tariffs, tradeAgreements, agencies } from "../schema";

/**
 * Overwrites MFN tariff rows with real, sourced rates from the World
 * Bank's WITS/TRAINS database where a rate is actually reported, leaving
 * everything else on the existing synthetic estimate. Deliberately scoped
 * to MFN only (not EAC/COMESA/AGOA/AfCFTA/EU/UK preferential rates) — see
 * the schema comment on tariffs.rateSource for why.
 *
 * Scoped to a curated list of Kenya's actual major trading partners
 * rather than all ~250 countries in the database, or even the full
 * EAC/COMESA/SADC/AGOA/EU union (~74 countries) tried in an earlier
 * pass — a single WITS request measured at ~5 seconds means every extra
 * country meaningfully adds to the runtime, and most of that broader
 * union isn't a country Kenya has a real, meaningful trade relationship
 * with anyway.
 *
 * Resumable: before spending an API call, checks whether this
 * product+country MFN row is already marked rateSource='real' from a
 * previous run and skips it if so — safe to stop and re-run at any
 * time (e.g. across a GitHub Actions job re-trigger) without redoing
 * already-verified work. A "no data" result is *not* remembered as
 * permanently skippable, since WITS coverage can improve over time and
 * this job is meant to be re-run periodically.
 */

const MAJOR_PARTNERS_ISO3 = new Set([
  // EAC
  "UGA", "TZA", "RWA", "BDI", "SSD", "COD",
  // Major COMESA / regional economies
  "EGY", "ETH", "ZMB",
  // SADC's largest economy
  "ZAF",
  // Other genuinely major real trading partners
  "CHN", "IND", "ARE", "USA", "GBR", "SAU", "JPN", "NLD", "DEU", "BEL", "PAK",
]);

const ISO3_TO_NUMERIC = new Map(
  (countriesData as { cca3: string; ccn3: string }[]).map((c) => [c.cca3, c.ccn3]),
);

const CONCURRENCY = 20;
const CURRENT_YEAR = new Date().getFullYear();
// Just the most recent year: MFN schedules rarely change year to year for
// a given product, and a single WITS request measured at ~5 seconds means
// every extra year tried meaningfully adds to the runtime.
const YEARS_TO_TRY = [CURRENT_YEAR - 1];

async function fetchMfnRate(reporterNumeric: string, hsCode: string): Promise<number | null> {
  for (const year of YEARS_TO_TRY) {
    const url = `https://wits.worldbank.org/API/V1/SDMX/V21/datasource/TRN/reporter/${reporterNumeric}/partner/000/product/${hsCode}/year/${year}/datatype/reported`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const xml = await res.text();
      // WITS still returns an <Obs> with OBS_VALUE="0" even when nothing
      // was actually reported (NBR_MFN_LINES="0", the rest marked N/A) —
      // a "SimpleAverage" over zero real lines, not a genuine 0% rate.
      // Only accept an observation backed by at least one real MFN line.
      const obsRegex = /<Obs[^>]*TARIFFTYPE="MFN"[^>]*\/>/g;
      const obsTags = xml.match(obsRegex) ?? [];
      for (const tag of obsTags) {
        const value = tag.match(/OBS_VALUE="([\d.]+)"/);
        const lines = tag.match(/NBR_MFN_LINES="(\d+)"/);
        if (value && lines && Number(lines[1]) > 0) return Number(value[1]);
      }
    } catch {
      // Network hiccup on one product/country/year — move on, this is a
      // best-effort sync, not a critical path the app depends on live.
      continue;
    }
  }
  return null;
}

/** Retries a query a few times on transient connection drops — this job
 * runs for a long time against Neon, and a mid-run disconnect otherwise
 * takes the whole run down with it. */
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

async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T, index: number) => Promise<void>) {
  let cursor = 0;
  async function next(): Promise<void> {
    const i = cursor++;
    if (i >= items.length) return;
    await worker(items[i], i);
    return next();
  }
  await Promise.all(Array.from({ length: limit }, next));
}

async function main() {
  const [productRows, countryRows, [wtoAgreement], [kra], alreadyRealRows] = await Promise.all([
    db.select({ id: products.id, hsCode: products.hsCode }).from(products),
    db.select({ id: countries.id, iso3: countries.iso3 }).from(countries),
    db.select({ id: tradeAgreements.id }).from(tradeAgreements).where(eq(tradeAgreements.code, "WTO-MFN")),
    db.select({ id: agencies.id }).from(agencies).where(eq(agencies.code, "KRA")),
    db
      .select({ productId: tariffs.productId, countryId: tariffs.countryId })
      .from(tariffs)
      .where(and(eq(tariffs.rateType, "mfn"), eq(tariffs.rateSource, "real"))),
  ]);

  const alreadyReal = new Set(alreadyRealRows.map((r) => `${r.productId}:${r.countryId}`));
  const scopedCountries = countryRows.filter((c) => MAJOR_PARTNERS_ISO3.has(c.iso3));

  const total = productRows.length * scopedCountries.length;
  console.log(
    `${productRows.length} products x ${scopedCountries.length} major partner countries = ${total} combinations (${alreadyReal.size} already verified real, will be skipped).`,
  );

  let checked = 0;
  let skipped = 0;
  let updated = 0;
  let inserted = 0;
  let noData = 0;

  const combos = productRows.flatMap((product) => scopedCountries.map((country) => ({ product, country })));

  await runWithConcurrency(combos, CONCURRENCY, async ({ product, country }) => {
    checked++;
    if (checked % 500 === 0) {
      console.log(
        `  ...${checked}/${total} checked (${skipped} skipped, ${updated} updated, ${inserted} inserted, ${noData} no data)`,
      );
    }

    if (alreadyReal.has(`${product.id}:${country.id}`)) {
      skipped++;
      return;
    }

    const numeric = ISO3_TO_NUMERIC.get(country.iso3);
    if (!numeric) return;

    const rate = await fetchMfnRate(numeric, product.hsCode);
    if (rate === null) {
      noData++;
      return;
    }

    const existing = await withRetry(() =>
      db
        .select({ id: tariffs.id })
        .from(tariffs)
        .where(and(eq(tariffs.productId, product.id), eq(tariffs.countryId, country.id), eq(tariffs.rateType, "mfn")))
        .limit(1),
    );

    if (existing.length > 0) {
      await withRetry(() =>
        db
          .update(tariffs)
          .set({ ratePercent: rate.toFixed(3), rateSource: "real" })
          .where(eq(tariffs.id, existing[0].id)),
      );
      updated++;
    } else if (wtoAgreement && kra) {
      await withRetry(() =>
        db.insert(tariffs).values({
          productId: product.id,
          countryId: country.id,
          agreementId: wtoAgreement.id,
          ratePercent: rate.toFixed(3),
          rateType: "mfn",
          rateSource: "real",
          effectiveFrom: `${CURRENT_YEAR}-01-01`,
          sourceAgencyId: kra.id,
        }),
      );
      inserted++;
    }
  });

  console.log(
    `Done. Checked ${checked}, skipped ${skipped} (already real), updated ${updated}, inserted ${inserted}, no real data for ${noData}.`,
  );
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
