import { db } from "../client";
import { tradeTransactions } from "../schema";
import { randomFloat, randomInt, pick, SEED_SCALE, checkSizeLimit, seedStopState } from "./utils";

/** Retries a query a few times on transient connection drops — Neon
 * connections in this sandbox intermittently drop mid-run, and this
 * script makes ~1,350 sequential batch inserts across ~2.7M rows, so one
 * dropped connection anywhere in that sequence otherwise takes the whole
 * run down with it. */
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

const MAJOR_PARTNERS = [
  "CHN", "IND", "ARE", "USA", "GBR", "DEU", "NLD", "UGA", "TZA", "RWA",
  "PAK", "JPN", "ZAF", "EGY", "SAU", "ETH", "BEL", "FRA", "ITA", "CAN",
  "KOR", "IDN", "VNM", "SGP", "TUR",
];

function monthRange(startYear: number, startMonth: number, count: number): string[] {
  const dates: string[] = [];
  let y = startYear;
  let m = startMonth;
  for (let i = 0; i < count; i++) {
    dates.push(`${y}-${String(m).padStart(2, "0")}-01`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return dates;
}

const MONTHS = monthRange(2019, 1, 72); // 2019-01 .. 2024-12

type Product = { id: number; hsCode: string; sectorId: number; unit: string };
type Port = { id: number; name: string; type: string };

/**
 * Real-world throughput shares, so mock port assignment isn't a uniform
 * coin flip between ports of the same type (that was the actual bug —
 * see backfill-realistic-port-shares.ts). Sourced 2026-09-09:
 *
 * Seaports: Port of Mombasa handled 45.45M tonnes in 2025 vs. Lamu
 * Port's 799,161 tonnes the same year (Lamu's biggest year yet, driven
 * by Red Sea shipping diversions) — Mombasa is ~98% of the two combined.
 * https://www.ecofinagency.com/news-industry/3001-52437-mombasa-port-throughput-jumps-11-to-45-45-million-tonnes-in-2025
 * https://www.theeastafrican.co.ke/tea/business-tech/can-lamu-port-sustain-its-gulf-conflict-windfall-5516594
 *
 * Airports: JKIA handled ~390,000 tonnes of air cargo in 2024 vs. Moi
 * International's 4,806.6 tonnes — JKIA is ~99% of the two combined.
 * https://www.logupdateafrica.com/air-cargo/how-is-jkia-preparing-to-handle-860000-tonnes-of-cargo-by-2045-1358576
 * https://africanpilot.africa/kenyas-aviation-sector-records-steady-growth-in-2024/
 *
 * Land borders: no single published truck-count table covers all six
 * crossings, so this ranking is directional, not a precise measured
 * split — grounded in the two data points that are published (Malaba
 * ~2,000 trucks/week, Namanga ~150 trucks/day) plus well-documented
 * Northern Corridor route significance (Malaba/Busia carry the
 * Uganda/Rwanda/DRC/Burundi corridor traffic; Namanga/Isebania/Taveta
 * carry Tanzania traffic; Nadapal's South Sudan route is the least
 * developed of the six).
 * https://lca.logcluster.org/kenya-239-border-crossing-malaba
 * https://lca.logcluster.org/kenya-232-border-crossing-namanga
 *
 * ICDs: both Embakasi and Naivasha have been expanded to the same
 * 450,000 TEU/year capacity, but Embakasi is the older, longer-
 * established facility next to Nairobi; Naivasha is newer and still
 * growing into its capacity. Split here is a judgment call, not a
 * sourced figure, given no published throughput comparison exists yet.
 * https://krc.co.ke/naivasha-inland-container-depot/
 */
export const PORT_TYPE_SHARE = { seaport: 0.48, land_border: 0.28, icd: 0.12, airport: 0.12 };
export const WITHIN_TYPE_SHARE: Record<string, Record<string, number>> = {
  seaport: { "Port of Mombasa": 0.97, "Lamu Port": 0.03 },
  airport: { "Jomo Kenyatta International Airport": 0.98, "Moi International Airport": 0.02 },
  land_border: {
    "Malaba Border Post": 0.3,
    "Busia Border Post": 0.22,
    "Namanga Border Post": 0.2,
    "Isebania Border Post": 0.14,
    "Taveta Border Post": 0.09,
    "Nadapal Border Post": 0.05,
  },
  icd: { "Embakasi Inland Container Depot": 0.65, "Naivasha Inland Container Depot": 0.35 },
};

/** Builds a pool where each port ID repeats proportionally to its real-world share, so a uniform pick() over the pool reproduces that weighting. */
function buildWeightedPortPool(ports: Port[], shares: Record<string, number>): number[] {
  const pool: number[] = [];
  for (const port of ports) {
    const weight = shares[port.name] ?? 0;
    for (let i = 0; i < Math.round(weight * 100); i++) pool.push(port.id);
  }
  return pool;
}

/**
 * Seeds trade_transactions only. market_opportunity_scores is no longer
 * generated here — it's computed for real from this table (plus tariffs,
 * trade_barriers, exporters) by db/scoring/compute-opportunity-scores.ts,
 * which should be run after this completes (or after any reseed).
 */
export async function seedTransactions(
  insertedProducts: Product[],
  countryIdByIso3: Map<string, number>,
  agencyIdByCode: Map<string, number>,
  portRows: Port[],
) {
  console.log("Seeding trade transactions...");
  const krAgencyId = agencyIdByCode.get("KRA")!;
  const knbsAgencyId = agencyIdByCode.get("KNBS")!;
  const allPortIds = portRows.map((p) => p.id);
  const weightedSeaports = buildWeightedPortPool(portRows.filter((p) => p.type === "seaport"), WITHIN_TYPE_SHARE.seaport);
  const weightedAirports = buildWeightedPortPool(portRows.filter((p) => p.type === "airport"), WITHIN_TYPE_SHARE.airport);
  const weightedLandBorders = buildWeightedPortPool(portRows.filter((p) => p.type === "land_border"), WITHIN_TYPE_SHARE.land_border);
  const weightedIcds = buildWeightedPortPool(portRows.filter((p) => p.type === "icd"), WITHIN_TYPE_SHARE.icd);

  const allCountryIds = [...countryIdByIso3.values()];
  const majorCountryIds = MAJOR_PARTNERS.map((iso3) => countryIdByIso3.get(iso3)).filter(
    Boolean,
  ) as number[];
  const weightedPool = [...allCountryIds, ...Array(6).fill(majorCountryIds).flat()];

  function pickPort(): number {
    const r = Math.random();
    if (r < PORT_TYPE_SHARE.land_border && weightedLandBorders.length) return pick(weightedLandBorders);
    if (r < PORT_TYPE_SHARE.land_border + PORT_TYPE_SHARE.icd && weightedIcds.length) return pick(weightedIcds);
    if (r < PORT_TYPE_SHARE.land_border + PORT_TYPE_SHARE.icd + PORT_TYPE_SHARE.airport && weightedAirports.length)
      return pick(weightedAirports);
    return weightedSeaports.length ? pick(weightedSeaports) : pick(allPortIds);
  }

  const TX_BATCH = 2000;
  let txBuffer: (typeof tradeTransactions.$inferInsert)[] = [];
  let txTotal = 0;

  async function flushTx() {
    if (txBuffer.length === 0) return;
    await withRetry(() => db.insert(tradeTransactions).values(txBuffer));
    txTotal += txBuffer.length;
    if (txTotal % 200000 < TX_BATCH) {
      console.log(`  trade_transactions: ${txTotal.toLocaleString()}`);
    }
    txBuffer = [];
    await checkSizeLimit();
  }

  for (const product of insertedProducts) {
    if (seedStopState.stopped) break;
    const numPartners = Math.max(3, Math.round(randomInt(8, 40) * SEED_SCALE));
    const partnerSet = new Set<number>();
    let guard = 0;
    while (partnerSet.size < numPartners && guard < numPartners * 10) {
      partnerSet.add(pick(weightedPool));
      guard++;
    }

    for (const countryId of partnerSet) {
      if (seedStopState.stopped) break;
      const flows: ("export" | "import")[] = [];
      const r = Math.random();
      if (r < 0.6) flows.push("export", "import");
      else if (r < 0.85) flows.push("export");
      else flows.push("import");

      for (const flowType of flows) {
        if (seedStopState.stopped) break;
        const baseMonthly = randomFloat(2, 300, 2) * 1000;
        const growthRate = randomFloat(-0.01, 0.02, 4);
        const phase = randomFloat(0, Math.PI * 2, 3);
        const unitPrice = randomFloat(0.5, 60, 2);
        const sourceAgencyId = Math.random() < 0.85 ? krAgencyId : knbsAgencyId;
        const keepProb = randomFloat(0.55, 0.95, 2);

        for (let m = 0; m < MONTHS.length; m++) {
          if (seedStopState.stopped) break;
          if (Math.random() > keepProb) continue;
          const seasonal = 1 + 0.15 * Math.sin((m / 12) * 2 * Math.PI + phase);
          const trend = Math.pow(1 + growthRate, m);
          const noise = randomFloat(0.8, 1.2, 3);
          const value = Math.max(100, baseMonthly * seasonal * trend * noise);
          const quantity = value / unitPrice;

          txBuffer.push({
            transactionDate: MONTHS[m],
            flowType,
            productId: product.id,
            countryId,
            portId: pickPort(),
            valueUsd: value.toFixed(2),
            quantity: quantity.toFixed(2),
            unit: product.unit,
            sourceAgencyId,
          });

          if (txBuffer.length >= TX_BATCH) await flushTx();
        }
      }
    }
  }

  await flushTx();
  console.log(`Seeded ${txTotal.toLocaleString()} trade_transactions.`);
  return { txTotal };
}
