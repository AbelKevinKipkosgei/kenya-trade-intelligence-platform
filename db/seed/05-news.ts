import { faker } from "@faker-js/faker";
import { db } from "../client";
import { newsArticles } from "../schema";
import { batchInsert, pick, SEED_SCALE } from "./utils";

const SOURCES = [
  "Business Daily Africa",
  "The EastAfrican",
  "Capital Business",
  "KBC",
  "Kenya News Agency",
  "AllAfrica",
  "Reuters Africa",
];

const CATEGORIES = ["tariff", "agreement", "market", "policy", "logistics"] as const;

const TITLE_TEMPLATES: ((sector: string, country: string) => string)[] = [
  (sector, country) => `Kenya eyes ${country} market for ${sector.toLowerCase()} exports`,
  (sector, country) => `${country} tariff review to affect Kenyan ${sector.toLowerCase()} exporters`,
  (sector) => `New KEBS certification scheme launched for ${sector.toLowerCase()} sector`,
  (sector, country) => `AfCFTA: Kenyan ${sector.toLowerCase()} producers eye ${country} demand`,
  (sector) => `Logistics delays at Mombasa port hit ${sector.toLowerCase()} shipments`,
  (sector, country) => `${country} non-tariff barrier flagged on Kenyan ${sector.toLowerCase()} shipments`,
  (sector) => `State Department for Trade unveils support package for ${sector.toLowerCase()} exporters`,
  (sector, country) => `Trade mission to ${country} targets ${sector.toLowerCase()} opportunities`,
];

export async function seedNews(
  sectorIdByName: Map<string, number>,
  countryIdByIso3: Map<string, number>,
  productsBySector: Map<number, { id: number }[]>,
  countryNameById: Map<number, string>,
) {
  console.log("Seeding news articles...");
  const sectors = [...sectorIdByName.entries()];
  const countryIds = [...countryIdByIso3.values()];
  const count = Math.max(200, Math.round(3000 * SEED_SCALE));
  const rows = [];

  for (let i = 0; i < count; i++) {
    const [sectorName, sectorId] = pick(sectors);
    const countryId = pick(countryIds);
    const countryName = countryNameById.get(countryId) ?? "a partner country";
    const template = pick(TITLE_TEMPLATES);
    const title = template(sectorName, countryName);
    const sectorProducts = productsBySector.get(sectorId);
    const relatedProductId = sectorProducts?.length ? pick(sectorProducts).id : null;

    rows.push({
      title,
      summary: faker.lorem.paragraph({ min: 2, max: 4 }),
      sourceName: pick(SOURCES),
      sourceUrl: `https://example.com/news/${faker.string.uuid()}`,
      publishedAt: faker.date.between({ from: "2019-01-01", to: "2024-12-31" }),
      category: pick(CATEGORIES),
      relatedProductId,
      relatedCountryId: countryId,
    });
  }

  await batchInsert("news_articles", rows, 1000, (batch) => db.insert(newsArticles).values(batch));
  return rows.length;
}
