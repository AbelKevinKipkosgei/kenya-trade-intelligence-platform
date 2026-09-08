/**
 * Static reference data: real Kenyan state corporations, real Kenyan
 * counties, real EAC/COMESA membership, and the real WCO Harmonized
 * System chapter list. This is factual/public-domain reference data —
 * only the transactional volumes generated elsewhere are synthetic.
 */

export const AGENCIES = [
  {
    code: "SDT",
    name: "State Department for Trade",
    description:
      "Responsible for trade policy, export development and promotion, trade negotiations, regional and international trade integration, and market access.",
  },
  {
    code: "KRA",
    name: "Kenya Revenue Authority",
    description:
      "Customs and border control agency; source of record for export/import transaction data.",
  },
  {
    code: "KEPROBA",
    name: "Kenya Export Promotion and Branding Agency",
    description: "Export promotion, branding, and market development.",
  },
  {
    code: "KEBS",
    name: "Kenya Bureau of Standards",
    description: "Standards, quality assurance, and conformity certification.",
  },
  {
    code: "EPZA",
    name: "Export Processing Zones Authority",
    description: "Regulates and promotes export processing zones.",
  },
  {
    code: "KENTRADE",
    name: "Kenya Trade Network Agency",
    description: "Operates the Kenya National Electronic Single Window System.",
  },
  {
    code: "KPA",
    name: "Kenya Ports Authority",
    description: "Manages Kenya's seaports, including the Port of Mombasa.",
  },
  {
    code: "KAA",
    name: "Kenya Airports Authority",
    description: "Manages Kenya's airports, including JKIA.",
  },
  {
    code: "AFA",
    name: "Agriculture and Food Authority",
    description: "Regulates agricultural production and trade, including export crops.",
  },
  {
    code: "KENINVEST",
    name: "Kenya Investment Authority",
    description: "Promotes and facilitates investment, including export-oriented FDI.",
  },
  {
    code: "KNBS",
    name: "Kenya National Bureau of Statistics",
    description: "National statistical office; publishes official trade statistics.",
  },
  {
    code: "KEPHIS",
    name: "Kenya Plant Health Inspectorate Service",
    description: "Phytosanitary inspection and certification for plant and plant-product imports and exports.",
  },
  {
    code: "MSEA",
    name: "Micro and Small Enterprises Authority",
    description: "Supports MSMEs, many of which are emerging exporters.",
  },
] as const;

export const SECTORS = [
  "Agriculture & Horticulture",
  "Coffee & Tea",
  "Textiles & Apparel",
  "Leather & Footwear",
  "Minerals & Mining",
  "Manufacturing (General)",
  "Chemicals & Plastics",
  "ICT & Digital Services",
  "Fisheries & Aquaculture",
  "Iron & Steel",
  "Automotive & Machinery",
  "Pharmaceuticals",
  "Handicrafts & Furniture",
  "Energy & Petroleum Products",
] as const;

// All 47 Kenyan counties with their region grouping.
export const KENYAN_COUNTIES: { name: string; region: string }[] = [
  { name: "Mombasa", region: "Coast" },
  { name: "Kwale", region: "Coast" },
  { name: "Kilifi", region: "Coast" },
  { name: "Tana River", region: "Coast" },
  { name: "Lamu", region: "Coast" },
  { name: "Taita-Taveta", region: "Coast" },
  { name: "Garissa", region: "North Eastern" },
  { name: "Wajir", region: "North Eastern" },
  { name: "Mandera", region: "North Eastern" },
  { name: "Marsabit", region: "Eastern" },
  { name: "Isiolo", region: "Eastern" },
  { name: "Meru", region: "Eastern" },
  { name: "Tharaka-Nithi", region: "Eastern" },
  { name: "Embu", region: "Eastern" },
  { name: "Kitui", region: "Eastern" },
  { name: "Machakos", region: "Eastern" },
  { name: "Makueni", region: "Eastern" },
  { name: "Nyandarua", region: "Central" },
  { name: "Nyeri", region: "Central" },
  { name: "Kirinyaga", region: "Central" },
  { name: "Murang'a", region: "Central" },
  { name: "Kiambu", region: "Central" },
  { name: "Turkana", region: "Rift Valley" },
  { name: "West Pokot", region: "Rift Valley" },
  { name: "Samburu", region: "Rift Valley" },
  { name: "Trans Nzoia", region: "Rift Valley" },
  { name: "Uasin Gishu", region: "Rift Valley" },
  { name: "Elgeyo-Marakwet", region: "Rift Valley" },
  { name: "Nandi", region: "Rift Valley" },
  { name: "Baringo", region: "Rift Valley" },
  { name: "Laikipia", region: "Rift Valley" },
  { name: "Nakuru", region: "Rift Valley" },
  { name: "Narok", region: "Rift Valley" },
  { name: "Kajiado", region: "Rift Valley" },
  { name: "Kericho", region: "Rift Valley" },
  { name: "Bomet", region: "Rift Valley" },
  { name: "Kakamega", region: "Western" },
  { name: "Vihiga", region: "Western" },
  { name: "Bungoma", region: "Western" },
  { name: "Busia", region: "Western" },
  { name: "Siaya", region: "Nyanza" },
  { name: "Kisumu", region: "Nyanza" },
  { name: "Homa Bay", region: "Nyanza" },
  { name: "Migori", region: "Nyanza" },
  { name: "Kisii", region: "Nyanza" },
  { name: "Nyamira", region: "Nyanza" },
  { name: "Nairobi", region: "Nairobi" },
];

export const PORTS: { name: string; type: string; county: string }[] = [
  { name: "Port of Mombasa", type: "seaport", county: "Mombasa" },
  { name: "Lamu Port", type: "seaport", county: "Lamu" },
  { name: "Jomo Kenyatta International Airport", type: "airport", county: "Nairobi" },
  { name: "Moi International Airport", type: "airport", county: "Mombasa" },
  { name: "Malaba Border Post", type: "land_border", county: "Busia" },
  { name: "Busia Border Post", type: "land_border", county: "Busia" },
  { name: "Namanga Border Post", type: "land_border", county: "Kajiado" },
  { name: "Isebania Border Post", type: "land_border", county: "Migori" },
  { name: "Taveta Border Post", type: "land_border", county: "Taita-Taveta" },
  { name: "Nadapal Border Post", type: "land_border", county: "Turkana" },
  { name: "Embakasi Inland Container Depot", type: "icd", county: "Nairobi" },
  { name: "Naivasha Inland Container Depot", type: "icd", county: "Nakuru" },
];

export const TRADE_AGREEMENTS = [
  {
    code: "EAC-CU",
    name: "East African Community Customs Union",
    description: "Customs union among EAC partner states with a common external tariff.",
    enteredIntoForce: "2005-01-01",
    status: "active",
  },
  {
    code: "COMESA-FTA",
    name: "COMESA Free Trade Area",
    description: "Free trade area among COMESA member states.",
    enteredIntoForce: "2000-10-31",
    status: "active",
  },
  {
    code: "AfCFTA",
    name: "African Continental Free Trade Area",
    description: "Continent-wide free trade area under the African Union.",
    enteredIntoForce: "2021-01-01",
    status: "active",
  },
  {
    code: "AGOA",
    name: "African Growth and Opportunity Act",
    description: "Unilateral U.S. trade preference programme for eligible sub-Saharan African countries.",
    enteredIntoForce: "2000-05-18",
    status: "active",
  },
  {
    code: "UK-EPA",
    name: "Kenya-UK Economic Partnership Agreement",
    description: "Bilateral trade agreement between Kenya and the United Kingdom.",
    enteredIntoForce: "2021-01-01",
    status: "active",
  },
  {
    code: "EU-EAC-EPA",
    name: "EU-EAC Economic Partnership Agreement",
    description: "Framework agreement between the EU and EAC partner states (signed by Kenya).",
    enteredIntoForce: "2016-09-01",
    status: "active",
  },
  {
    code: "WTO-MFN",
    name: "WTO Most Favoured Nation",
    description: "Baseline non-preferential tariff treatment under WTO rules.",
    enteredIntoForce: "1995-01-01",
    status: "active",
  },
  {
    code: "TRIPARTITE-FTA",
    name: "COMESA-EAC-SADC Tripartite Free Trade Area",
    description: "Proposed free trade area spanning three regional economic communities.",
    enteredIntoForce: null,
    status: "pending",
  },
] as const;

// ISO3 codes of EAC partner states (as of 2024).
export const EAC_MEMBERS = new Set([
  "KEN",
  "UGA",
  "TZA",
  "RWA",
  "BDI",
  "SSD",
  "COD",
  "SOM",
]);

// ISO3 codes of COMESA member states.
export const COMESA_MEMBERS = new Set([
  "BDI",
  "COM",
  "COD",
  "DJI",
  "EGY",
  "ERI",
  "SWZ",
  "ETH",
  "KEN",
  "LBY",
  "MDG",
  "MWI",
  "MUS",
  "RWA",
  "SYC",
  "SOM",
  "SDN",
  "TUN",
  "UGA",
  "ZMB",
  "ZWE",
]);

// ISO3 codes of SADC member states.
export const SADC_MEMBERS = new Set([
  "AGO",
  "BWA",
  "COM",
  "COD",
  "SWZ",
  "LSO",
  "MDG",
  "MWI",
  "MUS",
  "MOZ",
  "NAM",
  "SYC",
  "ZAF",
  "TZA",
  "ZMB",
  "ZWE",
]);

// Representative snapshot of long-standing AGOA-eligible countries. Actual
// U.S. eligibility is reviewed annually and fluctuates for some countries;
// this is a stable approximation for mock-data purposes, not a live list.
export const AGOA_ELIGIBLE = new Set([
  "BEN",
  "BWA",
  "CPV",
  "TCD",
  "COM",
  "DJI",
  "COD",
  "SWZ",
  "GMB",
  "GHA",
  "GNB",
  "CIV",
  "KEN",
  "LSO",
  "LBR",
  "MDG",
  "MWI",
  "MRT",
  "MUS",
  "MOZ",
  "NAM",
  "NGA",
  "RWA",
  "SEN",
  "SLE",
  "ZAF",
  "TZA",
  "TGO",
  "UGA",
  "ZMB",
]);

// EU-27 member states.
export const EU_MEMBERS = new Set([
  "AUT",
  "BEL",
  "BGR",
  "HRV",
  "CYP",
  "CZE",
  "DNK",
  "EST",
  "FIN",
  "FRA",
  "DEU",
  "GRC",
  "HUN",
  "IRL",
  "ITA",
  "LVA",
  "LTU",
  "LUX",
  "MLT",
  "NLD",
  "POL",
  "PRT",
  "ROU",
  "SVK",
  "SVN",
  "ESP",
  "SWE",
]);

/**
 * Real WCO Harmonized System chapters (public-domain nomenclature),
 * restricted to the chapters most relevant to Kenya's actual trade
 * profile. Used as the top-level grouping for the mock product catalog —
 * the chapter numbers/titles are real; the specific 6-digit subheadings
 * generated under them are illustrative mock entries for this dataset,
 * not a reproduction of the official KRA/WCO tariff book.
 */
export const HS_CHAPTERS: { chapter: string; title: string; sector: string }[] = [
  { chapter: "06", title: "Live trees and other plants; bulbs, roots; cut flowers", sector: "Agriculture & Horticulture" },
  { chapter: "07", title: "Edible vegetables and certain roots and tubers", sector: "Agriculture & Horticulture" },
  { chapter: "08", title: "Edible fruit and nuts; peel of citrus fruit or melons", sector: "Agriculture & Horticulture" },
  { chapter: "09", title: "Coffee, tea, mate and spices", sector: "Coffee & Tea" },
  { chapter: "10", title: "Cereals", sector: "Agriculture & Horticulture" },
  { chapter: "12", title: "Oil seeds and oleaginous fruits; miscellaneous grains, seeds and fruit", sector: "Agriculture & Horticulture" },
  { chapter: "03", title: "Fish and crustaceans, molluscs and other aquatic invertebrates", sector: "Fisheries & Aquaculture" },
  { chapter: "16", title: "Preparations of meat, fish or crustaceans", sector: "Fisheries & Aquaculture" },
  { chapter: "25", title: "Salt; sulphur; earths and stone; plastering materials, lime and cement", sector: "Minerals & Mining" },
  { chapter: "26", title: "Ores, slag and ash", sector: "Minerals & Mining" },
  { chapter: "71", title: "Natural or cultured pearls, precious or semi-precious stones, precious metals", sector: "Minerals & Mining" },
  { chapter: "27", title: "Mineral fuels, mineral oils and products of their distillation", sector: "Energy & Petroleum Products" },
  { chapter: "39", title: "Plastics and articles thereof", sector: "Chemicals & Plastics" },
  { chapter: "38", title: "Miscellaneous chemical products", sector: "Chemicals & Plastics" },
  { chapter: "30", title: "Pharmaceutical products", sector: "Pharmaceuticals" },
  { chapter: "41", title: "Raw hides and skins (other than furskins) and leather", sector: "Leather & Footwear" },
  { chapter: "42", title: "Articles of leather; saddlery and harness; travel goods, handbags", sector: "Leather & Footwear" },
  { chapter: "64", title: "Footwear, gaiters and the like", sector: "Leather & Footwear" },
  { chapter: "52", title: "Cotton", sector: "Textiles & Apparel" },
  { chapter: "61", title: "Articles of apparel and clothing accessories, knitted or crocheted", sector: "Textiles & Apparel" },
  { chapter: "62", title: "Articles of apparel and clothing accessories, not knitted or crocheted", sector: "Textiles & Apparel" },
  { chapter: "63", title: "Other made-up textile articles; sets; worn clothing", sector: "Textiles & Apparel" },
  { chapter: "72", title: "Iron and steel", sector: "Iron & Steel" },
  { chapter: "73", title: "Articles of iron or steel", sector: "Iron & Steel" },
  { chapter: "84", title: "Nuclear reactors, boilers, machinery and mechanical appliances", sector: "Automotive & Machinery" },
  { chapter: "85", title: "Electrical machinery and equipment and parts thereof", sector: "Automotive & Machinery" },
  { chapter: "87", title: "Vehicles other than railway or tramway rolling stock", sector: "Automotive & Machinery" },
  { chapter: "94", title: "Furniture; bedding; lamps and lighting fittings; prefabricated buildings", sector: "Handicrafts & Furniture" },
  { chapter: "46", title: "Manufactures of straw, esparto or other plaiting materials; basketware and wickerwork", sector: "Handicrafts & Furniture" },
  { chapter: "44", title: "Wood and articles of wood; wood charcoal", sector: "Handicrafts & Furniture" },
  { chapter: "17", title: "Sugars and sugar confectionery", sector: "Manufacturing (General)" },
  { chapter: "19", title: "Preparations of cereals, flour, starch or milk; bakers' wares", sector: "Manufacturing (General)" },
  { chapter: "20", title: "Preparations of vegetables, fruit, nuts or other parts of plants", sector: "Manufacturing (General)" },
  { chapter: "48", title: "Paper and paperboard; articles of paper pulp, paper or paperboard", sector: "Manufacturing (General)" },
  { chapter: "69", title: "Ceramic products", sector: "Manufacturing (General)" },
  { chapter: "76", title: "Aluminium and articles thereof", sector: "Manufacturing (General)" },
  { chapter: "85", title: "Electrical machinery, telecommunications equipment", sector: "ICT & Digital Services" },
  // Added to fix product names that don't semantically belong to any of
  // their sector's original chapters — see NAME_TO_CHAPTER below. Two of
  // these reuse a chapter already listed under a different sector (real
  // HS chapters aren't sector-exclusive in the first place), the same
  // pattern already used for chapter 85 above.
  { chapter: "23", title: "Residues and waste from the food industries; prepared animal fodder", sector: "Fisheries & Aquaculture" },
  { chapter: "71", title: "Natural or cultured pearls, precious or semi-precious stones, precious metals", sector: "Handicrafts & Furniture" },
  { chapter: "68", title: "Articles of stone, plaster, cement, asbestos, mica or similar materials", sector: "Handicrafts & Furniture" },
  { chapter: "39", title: "Plastics and articles thereof", sector: "Manufacturing (General)" },
  { chapter: "15", title: "Animal or vegetable fats and oils and their cleavage products", sector: "Manufacturing (General)" },
  { chapter: "22", title: "Beverages, spirits and vinegar", sector: "Manufacturing (General)" },
  { chapter: "96", title: "Miscellaneous manufactured articles", sector: "Manufacturing (General)" },
];

/**
 * Which real HS chapter each specific product name actually belongs to.
 * Without this, the seed generator picked a random chapter within a
 * sector and a random name from that sector's pool independently, so a
 * name like "Baby Corn" (a vegetable) could land under chapter 06 (live
 * plants/cut flowers) purely by chance — every product using that name
 * ended up with a description sourced from the wrong chapter entirely,
 * not just an imprecise one. This map is the actual source of truth for
 * chapter assignment now; HS_CHAPTERS above still supplies each chapter's
 * title/sector, but a sector's *set* of chapters is no longer picked
 * from directly — see backfill-correct-chapters.ts and 02-catalog.ts.
 */
export const NAME_TO_CHAPTER: Record<string, string> = {
  // Agriculture & Horticulture
  "Fresh Cut Roses": "06",
  "Cut Foliage": "06",
  "French Beans": "07",
  "Snow Peas": "07",
  "Fresh Chillies": "07",
  "Baby Corn": "07",
  "Runner Beans": "07",
  "Avocados": "08",
  "Mangoes": "08",
  "Passion Fruit": "08",
  "Macadamia Nuts": "08",
  "Pineapples": "08",
  // Fisheries & Aquaculture
  "Nile Perch Fillets": "03",
  "Frozen Tilapia": "03",
  "Dried Fish": "03",
  "Farmed Prawns": "03",
  "Fish Maws": "03",
  "Smoked Fish": "03",
  "Fish Meal": "23",
  // Leather & Footwear
  "Raw Hides": "41",
  "Tanned Leather": "41",
  "Leather Handbags": "42",
  "Leather Belts": "42",
  "Safety Boots": "64",
  "Sports Shoes": "64",
  "School Shoes": "64",
  "Sandals": "64",
  // Handicrafts & Furniture
  "Wooden Furniture": "94",
  "Wicker Chairs": "94",
  "Sisal Baskets": "46",
  "Woven Mats": "46",
  "Wood Carvings": "44",
  "Soapstone Carvings": "68",
  "Beaded Jewelry": "71",
  // Manufacturing (General)
  "Exercise Books": "48",
  "Cardboard Packaging": "48",
  "Ceramic Tiles": "69",
  "Ceramic Tableware": "69",
  "Packaged Snacks": "19",
  "Plastic Containers": "39",
  "Cooking Oil": "15",
  "Bottled Water": "22",
  "Ballpoint Pens": "96",
};
