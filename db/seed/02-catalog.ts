import { faker } from "@faker-js/faker";
import { db } from "../client";
import { products, tradeAgreements, agreementMembers, tariffs } from "../schema";
import {
  HS_CHAPTERS,
  TRADE_AGREEMENTS,
  EAC_MEMBERS,
  COMESA_MEMBERS,
  SADC_MEMBERS,
  AGOA_ELIGIBLE,
  EU_MEMBERS,
} from "./reference-data";
import { batchInsert, pick, randomInt, randomFloat, SEED_SCALE } from "./utils";

const SECTOR_UNITS: Record<string, string[]> = {
  "Agriculture & Horticulture": ["kg", "tonnes"],
  "Coffee & Tea": ["kg", "tonnes"],
  "Textiles & Apparel": ["units", "kg"],
  "Leather & Footwear": ["units", "kg"],
  "Minerals & Mining": ["tonnes", "kg"],
  "Manufacturing (General)": ["units", "kg"],
  "Chemicals & Plastics": ["kg", "litres", "tonnes"],
  "ICT & Digital Services": ["units"],
  "Fisheries & Aquaculture": ["kg", "tonnes"],
  "Iron & Steel": ["tonnes", "kg"],
  "Automotive & Machinery": ["units"],
  Pharmaceuticals: ["kg", "units"],
  "Handicrafts & Furniture": ["units"],
  "Energy & Petroleum Products": ["litres", "tonnes"],
};

// Plausible item names per sector, used instead of a randomly generated
// adjective+noun pair — faker's generic commerce vocabulary produced
// nonsense like "Coffee, tea, mate and spices — Sleek Chicken".
const SECTOR_PRODUCT_NAMES: Record<string, string[]> = {
  "Agriculture & Horticulture": [
    "Fresh Cut Roses", "Avocados", "French Beans", "Snow Peas", "Mangoes",
    "Passion Fruit", "Macadamia Nuts", "Fresh Chillies", "Baby Corn",
    "Pineapples", "Cut Foliage", "Runner Beans",
  ],
  "Coffee & Tea": [
    "Arabica Coffee Beans", "Robusta Coffee Beans", "Green Coffee",
    "Roasted Coffee", "Black Tea Leaves", "Green Tea", "Herbal Infusion",
    "Instant Coffee Granules", "CTC Tea", "Orthodox Tea",
  ],
  "Textiles & Apparel": [
    "Cotton T-Shirts", "Knitted Sweaters", "Woven Cotton Fabric",
    "Denim Jeans", "School Uniforms", "Cotton Yarn", "Kitenge Fabric",
    "Work Overalls", "Baby Clothing", "Sportswear",
  ],
  "Leather & Footwear": [
    "Leather Handbags", "Safety Boots", "Sports Shoes", "Leather Belts",
    "Sandals", "Raw Hides", "Tanned Leather", "School Shoes",
  ],
  "Minerals & Mining": [
    "Soda Ash", "Titanium Ore", "Fluorspar", "Gold Ore", "Limestone",
    "Gemstones", "Diatomite", "Kaolin Clay", "Manganese Ore",
  ],
  "Manufacturing (General)": [
    "Packaged Snacks", "Bottled Water", "Plastic Containers",
    "Ceramic Tiles", "Ballpoint Pens", "Ceramic Tableware",
    "Exercise Books", "Cardboard Packaging", "Cooking Oil",
  ],
  "Chemicals & Plastics": [
    "Industrial Adhesives", "PVC Pipes", "Detergent Powder",
    "Plastic Sheeting", "Fertilizer Blends", "Paints & Coatings",
    "Soap Bars", "Insecticides", "Plastic Housewares",
  ],
  "ICT & Digital Services": [
    "Mobile Handsets", "Network Routers", "Solar Inverters",
    "Circuit Boards", "Data Cables", "Set-Top Boxes", "SIM Cards",
  ],
  "Fisheries & Aquaculture": [
    "Nile Perch Fillets", "Frozen Tilapia", "Dried Fish", "Fish Meal",
    "Farmed Prawns", "Fish Maws", "Smoked Fish",
  ],
  "Iron & Steel": [
    "Steel Rebar", "Galvanized Sheets", "Steel Wire", "Structural Beams",
    "Steel Pipes", "Wire Nails", "Roofing Sheets",
  ],
  "Automotive & Machinery": [
    "Motor Vehicle Parts", "Agricultural Tractors", "Water Pumps",
    "Diesel Generators", "Bicycle Frames", "Motorcycle Parts",
    "Irrigation Equipment",
  ],
  Pharmaceuticals: [
    "Antimalarial Tablets", "Antibiotic Capsules", "Vaccines",
    "Oral Rehydration Salts", "Surgical Gloves", "Pain Relief Tablets",
    "Antiseptic Solution",
  ],
  "Handicrafts & Furniture": [
    "Sisal Baskets", "Wooden Furniture", "Soapstone Carvings",
    "Wicker Chairs", "Beaded Jewelry", "Wood Carvings", "Woven Mats",
  ],
  "Energy & Petroleum Products": [
    "Refined Petroleum", "LPG Cylinders", "Diesel Fuel", "Solar Panels",
    "Charcoal Briquettes", "Lubricating Oils", "Kerosene",
  ],
};

export async function seedCatalog(sectorIdByName: Map<string, number>) {
  console.log("Seeding products (HS codes)...");
  const usedCodes = new Set<string>();
  const productRows: { hsCode: string; description: string; sectorId: number; unit: string }[] = [];

  for (const { chapter, title, sector } of HS_CHAPTERS) {
    const sectorId = sectorIdByName.get(sector);
    if (!sectorId) continue;
    const units = SECTOR_UNITS[sector] ?? ["units"];
    const names = SECTOR_PRODUCT_NAMES[sector] ?? [title];
    const count = Math.max(1, Math.round(randomInt(25, 45) * SEED_SCALE));

    for (let i = 0; i < count; i++) {
      let code: string;
      let attempts = 0;
      do {
        const heading = String(randomInt(1, 99)).padStart(2, "0");
        const subheading = String(randomInt(1, 99)).padStart(2, "0");
        code = `${chapter}${heading}${subheading}`;
        attempts++;
      } while (usedCodes.has(code) && attempts < 20);
      if (usedCodes.has(code)) continue;
      usedCodes.add(code);

      productRows.push({
        hsCode: code,
        description: `${title} – ${pick(names)}`,
        sectorId,
        unit: pick(units),
      });
    }
  }

  const insertedProducts: { id: number; hsCode: string; sectorId: number; unit: string; description: string }[] = [];
  await batchInsert("products", productRows, 500, async (batch) => {
    const rows = await db.insert(products).values(batch).returning({
      id: products.id,
      hsCode: products.hsCode,
      sectorId: products.sectorId,
      unit: products.unit,
      description: products.description,
    });
    insertedProducts.push(...rows);
  });

  console.log("Seeding trade agreements...");
  const agreementRows = await db
    .insert(tradeAgreements)
    .values(
      TRADE_AGREEMENTS.map((a) => ({
        code: a.code,
        name: a.name,
        description: a.description,
        enteredIntoForce: a.enteredIntoForce,
        status: a.status,
      })),
    )
    .returning();
  const agreementIdByCode = new Map(agreementRows.map((r) => [r.code, r.id]));

  return { insertedProducts, agreementIdByCode };
}

export async function seedAgreementMembers(
  countryIdByIso3: Map<string, number>,
  agreementIdByCode: Map<string, number>,
) {
  console.log("Seeding agreement memberships...");
  const allIso3 = [...countryIdByIso3.keys()];
  const membership: { agreementId: number; countryId: number; joinedDate: string | null }[] = [];

  const addMembers = (code: string, iso3s: Iterable<string>) => {
    const agreementId = agreementIdByCode.get(code);
    if (!agreementId) return;
    // No per-country accession data in this mock dataset; the agreement's
    // own entry-into-force date is a reasonable stand-in for "joined".
    const joinedDate = TRADE_AGREEMENTS.find((a) => a.code === code)?.enteredIntoForce ?? null;
    for (const iso3 of iso3s) {
      const countryId = countryIdByIso3.get(iso3);
      if (countryId) membership.push({ agreementId, countryId, joinedDate });
    }
  };

  addMembers("EAC-CU", EAC_MEMBERS);
  addMembers("COMESA-FTA", COMESA_MEMBERS);
  addMembers("AGOA", AGOA_ELIGIBLE);
  addMembers("EU-EAC-EPA", EU_MEMBERS);
  addMembers("UK-EPA", ["GBR"]);
  addMembers("WTO-MFN", allIso3);
  addMembers(
    "TRIPARTITE-FTA",
    new Set([...EAC_MEMBERS, ...COMESA_MEMBERS, ...SADC_MEMBERS]),
  );
  // AfCFTA: all African countries in our reference table.
  addMembers(
    "AfCFTA",
    allIso3.filter((iso3) =>
      [...EAC_MEMBERS, ...COMESA_MEMBERS, ...SADC_MEMBERS].includes(iso3),
    ),
  );

  await batchInsert("agreement_members", membership, 1000, (batch) =>
    db.insert(agreementMembers).values(batch).onConflictDoNothing(),
  );
}

export async function seedTariffs(
  insertedProducts: { id: number; hsCode: string; sectorId: number }[],
  countryIdByIso3: Map<string, number>,
  agreementIdByCode: Map<string, number>,
  agencyIdByCode: Map<string, number>,
) {
  console.log("Seeding tariffs...");
  const krAgencyId = agencyIdByCode.get("KRA")!;
  const wtoId = agreementIdByCode.get("WTO-MFN")!;
  const eacId = agreementIdByCode.get("EAC-CU")!;
  const comesaId = agreementIdByCode.get("COMESA-FTA")!;
  const afcftaId = agreementIdByCode.get("AfCFTA")!;
  const agoaId = agreementIdByCode.get("AGOA")!;
  const euId = agreementIdByCode.get("EU-EAC-EPA")!;
  const ukId = agreementIdByCode.get("UK-EPA")!;

  const usaId = countryIdByIso3.get("USA");
  const gbrId = countryIdByIso3.get("GBR");
  const euCountryIds = new Set(
    [...EU_MEMBERS].map((iso3) => countryIdByIso3.get(iso3)).filter(Boolean) as number[],
  );
  const eacCountryIds = new Set(
    [...EAC_MEMBERS].map((iso3) => countryIdByIso3.get(iso3)).filter(Boolean) as number[],
  );
  const comesaCountryIds = new Set(
    [...COMESA_MEMBERS].map((iso3) => countryIdByIso3.get(iso3)).filter(Boolean) as number[],
  );
  const allCountryIds = [...countryIdByIso3.values()];

  const rows: {
    productId: number;
    countryId: number;
    agreementId: number;
    ratePercent: string;
    rateType: string;
    effectiveFrom: string;
    sourceAgencyId: number;
  }[] = [];

  for (const product of insertedProducts) {
    const partnerCount = Math.max(5, Math.round(randomInt(15, 60) * SEED_SCALE));
    const partners = faker.helpers.arrayElements(allCountryIds, Math.min(partnerCount, allCountryIds.length));

    for (const countryId of partners) {
      rows.push({
        productId: product.id,
        countryId,
        agreementId: wtoId,
        ratePercent: randomFloat(0, 35, 1).toFixed(3),
        rateType: "mfn",
        effectiveFrom: "2022-01-01",
        sourceAgencyId: krAgencyId,
      });

      if (eacCountryIds.has(countryId)) {
        rows.push({
          productId: product.id,
          countryId,
          agreementId: eacId,
          ratePercent: randomFloat(0, 5, 1).toFixed(3),
          rateType: "preferential",
          effectiveFrom: "2022-01-01",
          sourceAgencyId: krAgencyId,
        });
      }
      if (comesaCountryIds.has(countryId)) {
        rows.push({
          productId: product.id,
          countryId,
          agreementId: comesaId,
          ratePercent: randomFloat(0, 8, 1).toFixed(3),
          rateType: "preferential",
          effectiveFrom: "2022-01-01",
          sourceAgencyId: krAgencyId,
        });
      }
      if (usaId === countryId) {
        rows.push({
          productId: product.id,
          countryId,
          agreementId: agoaId,
          ratePercent: randomFloat(0, 2, 1).toFixed(3),
          rateType: "preferential",
          effectiveFrom: "2022-01-01",
          sourceAgencyId: krAgencyId,
        });
      }
      if (gbrId === countryId) {
        rows.push({
          productId: product.id,
          countryId,
          agreementId: ukId,
          ratePercent: randomFloat(0, 3, 1).toFixed(3),
          rateType: "preferential",
          effectiveFrom: "2022-01-01",
          sourceAgencyId: krAgencyId,
        });
      }
      if (euCountryIds.has(countryId)) {
        rows.push({
          productId: product.id,
          countryId,
          agreementId: euId,
          ratePercent: randomFloat(0, 4, 1).toFixed(3),
          rateType: "preferential",
          effectiveFrom: "2022-01-01",
          sourceAgencyId: krAgencyId,
        });
      }
      if (Math.random() < 0.4) {
        rows.push({
          productId: product.id,
          countryId,
          agreementId: afcftaId,
          ratePercent: randomFloat(0, 6, 1).toFixed(3),
          rateType: "preferential",
          effectiveFrom: "2022-01-01",
          sourceAgencyId: krAgencyId,
        });
      }
    }
  }

  return batchInsert("tariffs", rows, 2000, (batch) => db.insert(tariffs).values(batch));
}
