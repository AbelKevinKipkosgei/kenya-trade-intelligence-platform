import "./load-env";
import { pool, db } from "../client";
import { products, sectors } from "../schema";
import { pick } from "./utils";

// Kept in sync with the SECTOR_PRODUCT_NAMES map in 02-catalog.ts.
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

async function main() {
  const productRows = await db
    .select({ id: products.id, description: products.description, sectorId: products.sectorId })
    .from(products);
  const sectorRows = await db.select({ id: sectors.id, name: sectors.name }).from(sectors);
  const sectorNameById = new Map(sectorRows.map((r) => [r.id, r.name]));

  const updates = productRows.map((p) => {
    const chapterTitle = p.description.split(/ [—–] /)[0];
    const sectorName = sectorNameById.get(p.sectorId);
    const names = (sectorName && SECTOR_PRODUCT_NAMES[sectorName]) || [chapterTitle];
    return { id: p.id, description: `${chapterTitle} – ${pick(names)}` };
  });

  const values = updates.map((_, i) => `($${i * 2 + 1}::int, $${i * 2 + 2}::text)`).join(", ");
  const params = updates.flatMap((u) => [u.id, u.description]);

  await pool.query(
    `UPDATE products AS p SET description = v.description FROM (VALUES ${values}) AS v(id, description) WHERE p.id = v.id`,
    params,
  );

  console.log(`Updated descriptions for ${updates.length} products.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
