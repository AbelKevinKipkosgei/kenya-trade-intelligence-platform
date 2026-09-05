import { db } from "../client";
import { tradeTransactions } from "../schema";
import { randomFloat, randomInt, pick, SEED_SCALE, checkSizeLimit, seedStopState } from "./utils";

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
type Port = { id: number; type: string };

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
  const seaports = portRows.filter((p) => p.type === "seaport").map((p) => p.id);
  const airports = portRows.filter((p) => p.type === "airport").map((p) => p.id);
  const landBorders = portRows.filter((p) => p.type === "land_border").map((p) => p.id);
  const allPortIds = portRows.map((p) => p.id);

  const allCountryIds = [...countryIdByIso3.values()];
  const majorCountryIds = MAJOR_PARTNERS.map((iso3) => countryIdByIso3.get(iso3)).filter(
    Boolean,
  ) as number[];
  const weightedPool = [...allCountryIds, ...Array(6).fill(majorCountryIds).flat()];

  function pickPort(): number {
    const r = Math.random();
    if (r < 0.3 && landBorders.length) return pick(landBorders);
    if (r < 0.45 && airports.length) return pick(airports);
    return seaports.length ? pick(seaports) : pick(allPortIds);
  }

  const TX_BATCH = 2000;
  let txBuffer: (typeof tradeTransactions.$inferInsert)[] = [];
  let txTotal = 0;

  async function flushTx() {
    if (txBuffer.length === 0) return;
    await db.insert(tradeTransactions).values(txBuffer);
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
