import { db } from "../client";
import { tradeTransactions, marketOpportunityScores } from "../schema";
import { randomFloat, randomInt, pick, SEED_SCALE } from "./utils";

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
const QUARTERS = Array.from({ length: 24 }, (_, i) => {
  const year = 2019 + Math.floor(i / 4);
  const qMonth = (i % 4) * 3 + 1;
  return `${year}-${String(qMonth).padStart(2, "0")}-01`;
});

type Product = { id: number; hsCode: string; sectorId: number; unit: string };
type Port = { id: number; type: string };

function scoreComponent(bias = 50, spread = 30): number {
  return Math.min(100, Math.max(0, randomFloat(bias - spread, bias + spread, 1)));
}

export async function seedTransactionsAndScores(
  insertedProducts: Product[],
  countryIdByIso3: Map<string, number>,
  agencyIdByCode: Map<string, number>,
  portRows: Port[],
) {
  console.log("Seeding trade transactions and market opportunity scores...");
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
  const SCORE_BATCH = 2000;
  let txBuffer: (typeof tradeTransactions.$inferInsert)[] = [];
  let scoreBuffer: (typeof marketOpportunityScores.$inferInsert)[] = [];
  let txTotal = 0;
  let scoreTotal = 0;

  async function flushTx() {
    if (txBuffer.length === 0) return;
    await db.insert(tradeTransactions).values(txBuffer);
    txTotal += txBuffer.length;
    if (txTotal % 200000 < TX_BATCH) {
      console.log(`  trade_transactions: ${txTotal.toLocaleString()}`);
    }
    txBuffer = [];
  }

  async function flushScores() {
    if (scoreBuffer.length === 0) return;
    await db.insert(marketOpportunityScores).values(scoreBuffer);
    scoreTotal += scoreBuffer.length;
    scoreBuffer = [];
  }

  for (const product of insertedProducts) {
    const numPartners = Math.max(3, Math.round(randomInt(8, 40) * SEED_SCALE));
    const partnerSet = new Set<number>();
    let guard = 0;
    while (partnerSet.size < numPartners && guard < numPartners * 10) {
      partnerSet.add(pick(weightedPool));
      guard++;
    }

    for (const countryId of partnerSet) {
      const flows: ("export" | "import")[] = [];
      const r = Math.random();
      if (r < 0.6) flows.push("export", "import");
      else if (r < 0.85) flows.push("export");
      else flows.push("import");

      for (const flowType of flows) {
        const baseMonthly = randomFloat(2, 300, 2) * 1000;
        const growthRate = randomFloat(-0.01, 0.02, 4);
        const phase = randomFloat(0, Math.PI * 2, 3);
        const unitPrice = randomFloat(0.5, 60, 2);
        const sourceAgencyId = Math.random() < 0.85 ? krAgencyId : knbsAgencyId;
        const keepProb = randomFloat(0.55, 0.95, 2);

        for (let m = 0; m < MONTHS.length; m++) {
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

      // Market Opportunity Score: quarterly, export-oriented, sparsified.
      for (let q = 0; q < QUARTERS.length; q++) {
        if (Math.random() > 0.5) continue;
        const demand = scoreComponent();
        const growth = scoreComponent();
        const competitiveness = scoreComponent();
        const marketAccess = scoreComponent();
        const competition = scoreComponent();
        const logistics = scoreComponent();
        const domesticCapacity = scoreComponent();
        const overall =
          (demand + growth + competitiveness + marketAccess + competition + logistics + domesticCapacity) / 7;

        scoreBuffer.push({
          productId: product.id,
          countryId,
          period: QUARTERS[q],
          demandScore: demand.toFixed(2),
          growthScore: growth.toFixed(2),
          competitivenessScore: competitiveness.toFixed(2),
          marketAccessScore: marketAccess.toFixed(2),
          competitionScore: competition.toFixed(2),
          logisticsScore: logistics.toFixed(2),
          domesticCapacityScore: domesticCapacity.toFixed(2),
          overallScore: overall.toFixed(2),
        });

        if (scoreBuffer.length >= SCORE_BATCH) await flushScores();
      }
    }
  }

  await flushTx();
  await flushScores();
  console.log(
    `Seeded ${txTotal.toLocaleString()} trade_transactions and ${scoreTotal.toLocaleString()} market_opportunity_scores.`,
  );
  return { txTotal, scoreTotal };
}
