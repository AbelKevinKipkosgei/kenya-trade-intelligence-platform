import { faker } from "@faker-js/faker";
import { db } from "../client";
import { tradeBarriers } from "../schema";
import { batchInsert, pick, SEED_SCALE } from "./utils";

const BARRIER_TYPES = ["non_tariff", "sps", "technical", "quota", "licensing"] as const;
type BarrierType = (typeof BARRIER_TYPES)[number];
const IMPACT_LEVELS = ["low", "medium", "high"] as const;

const DESCRIPTION_TEMPLATES: Record<BarrierType, (country: string, product: string) => string> = {
  non_tariff: (country, product) =>
    `${country} import quota restricts ${product} shipments from Kenya.`,
  sps: (country, product) =>
    `${country} phytosanitary/sanitary requirements for ${product} require certification beyond standard export documentation.`,
  technical: (country, product) =>
    `${country} technical or labeling standard for ${product} is not yet harmonized with Kenyan production standards.`,
  quota: (country, product) =>
    `${country} tariff-rate quota limits duty-free ${product} exports beyond an annual threshold.`,
  licensing: (country, product) =>
    `${country} import licensing requirement is delaying customs clearance of ${product} shipments.`,
};

type Product = { id: number; hsCode: string; description: string };

export async function seedTradeBarriers(
  insertedProducts: Product[],
  countryIdByIso3: Map<string, number>,
  countryNameById: Map<number, string>,
  agencyIdByCode: Map<string, number>,
) {
  console.log("Seeding trade barriers...");

  const agencyByType: Record<BarrierType, number> = {
    non_tariff: agencyIdByCode.get("SDT")!,
    sps: agencyIdByCode.get("KEPHIS")!,
    technical: agencyIdByCode.get("KEBS")!,
    quota: agencyIdByCode.get("SDT")!,
    licensing: agencyIdByCode.get("KEPROBA")!,
  };

  const allCountryIds = [...countryIdByIso3.values()];
  const count = Math.max(200, Math.round(4000 * SEED_SCALE));
  const rows: (typeof tradeBarriers.$inferInsert)[] = [];

  for (let i = 0; i < count; i++) {
    const product = pick(insertedProducts);
    const countryId = pick(allCountryIds);
    const countryName = countryNameById.get(countryId) ?? "the destination market";
    const barrierType = pick(BARRIER_TYPES);
    const status = faker.helpers.weightedArrayElement([
      { value: "active" as const, weight: 5 },
      { value: "monitoring" as const, weight: 3 },
      { value: "resolved" as const, weight: 2 },
    ]);
    const reportedDate = faker.date.between({ from: "2019-01-01", to: "2024-10-01" });
    const resolvedDate = status === "resolved" ? faker.date.between({ from: reportedDate, to: "2024-12-31" }) : null;
    // Use the real HS-chapter title half of the description, not the
    // random faker-generated noun after the dash.
    const productLabel = product.description.split(/ [—–] /)[0].toLowerCase();

    rows.push({
      productId: product.id,
      countryId,
      sourceAgencyId: agencyByType[barrierType],
      barrierType,
      description: DESCRIPTION_TEMPLATES[barrierType](countryName, productLabel),
      status,
      impactLevel: pick(IMPACT_LEVELS),
      reportedDate: reportedDate.toISOString().slice(0, 10),
      resolvedDate: resolvedDate ? resolvedDate.toISOString().slice(0, 10) : null,
    });
  }

  return batchInsert("trade_barriers", rows, 1000, (batch) => db.insert(tradeBarriers).values(batch));
}
