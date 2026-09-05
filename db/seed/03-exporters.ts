import { faker } from "@faker-js/faker";
import { db } from "../client";
import { exporters } from "../schema";
import { batchInsert, pick, randomInt, SEED_SCALE } from "./utils";

const CERTIFICATIONS = [
  "KEBS Diamond Mark",
  "ISO 9001",
  "ISO 22000",
  "HACCP",
  "Fairtrade",
  "Organic (EU)",
  "GlobalG.A.P.",
  "Halal",
  "FSC",
];

const CAPACITY_UNITS = ["tonnes/year", "units/year", "litres/year", "kg/year"];

const COMPANY_SUFFIXES = ["Ltd", "Exporters Ltd", "Traders Ltd", "Kenya Ltd", "Holdings Ltd", "Co. Ltd"];

export async function seedExporters(
  countyIdByName: Map<string, number>,
  sectorIdByName: Map<string, number>,
  productsBySector: Map<number, { id: number }[]>,
  agencyIdByCode: Map<string, number>,
) {
  console.log("Seeding exporters (Kenyan Export Capacity Map)...");
  const counties = [...countyIdByName.entries()];
  const sectors = [...sectorIdByName.entries()];
  const keprobaId = agencyIdByCode.get("KEPROBA")!;
  const epzaId = agencyIdByCode.get("EPZA")!;

  const count = Math.max(100, Math.round(5000 * SEED_SCALE));
  const rows = [];

  for (let i = 0; i < count; i++) {
    const [countyName, countyId] = pick(counties);
    const [sectorName, sectorId] = pick(sectors);
    const sectorProducts = productsBySector.get(sectorId);
    if (!sectorProducts || sectorProducts.length === 0) continue;
    const primaryProductId = pick(sectorProducts).id;

    rows.push({
      name: `${faker.company.name().replace(/,?\s*(LLC|Inc\.?|Group)$/i, "")} ${pick(COMPANY_SUFFIXES)}`,
      countyId,
      sectorId,
      primaryProductId,
      employeesCount: randomInt(5, 2000),
      annualCapacity: randomInt(500, 500000),
      capacityUnit: pick(CAPACITY_UNITS),
      certifications: faker.helpers.arrayElements(CERTIFICATIONS, randomInt(0, 4)),
      exportReady: Math.random() > 0.15,
      contactEmail: faker.internet.email().toLowerCase(),
      registeredWithAgencyId: Math.random() > 0.5 ? keprobaId : epzaId,
      description: `${sectorName} producer based in ${countyName} County.`,
    });
  }

  await batchInsert("exporters", rows, 1000, (batch) => db.insert(exporters).values(batch));
  return rows.length;
}
