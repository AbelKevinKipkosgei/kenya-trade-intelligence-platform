import { db } from "../client";
import { agencies, procedures } from "../schema";
import type { ProcedureStep } from "../schema/procedures";

type ProcedureSeed = {
  slug: string;
  title: string;
  category: "import" | "export" | "certification" | "licensing" | "customs";
  sector: string | null;
  summary: string;
  leadAgency: string;
  estimatedTotalDays: number;
  steps: ProcedureStep[];
};

// Illustrative procedural guidance modeled on Kenya's real regulatory
// framework. Fees/timelines are approximate and should be verified with
// the named agency — the goal is to centralize "which agency, which
// form, in what order", not to be the authoritative fee schedule.
const PROCEDURE_SEEDS: ProcedureSeed[] = [
  {
    slug: "register-general-importer",
    title: "Register as an Importer in Kenya",
    category: "import",
    sector: null,
    summary:
      "The baseline registration every importer needs before bringing any goods into Kenya, regardless of product.",
    leadAgency: "KRA",
    estimatedTotalDays: 10,
    steps: [
      { order: 1, title: "Obtain a KRA PIN", description: "Register for a Personal Identification Number via iTax if you don't already have one — required for all customs transactions.", agencyCode: "KRA", documentsRequired: ["National ID / Certificate of Incorporation", "Business registration certificate"], estimatedDays: 1 },
      { order: 2, title: "Register on the Kenya National Single Window System", description: "Create an importer account on KenTrade's Single Window System, used to submit and track import declarations across all agencies.", agencyCode: "KENTRADE", documentsRequired: ["KRA PIN certificate", "Business registration certificate"], estimatedDays: 3 },
      { order: 3, title: "Identify the correct HS code for your product", description: "Use the Market & Product Explorer to confirm the HS code and applicable tariff rate before ordering goods.", estimatedDays: 1 },
      { order: 4, title: "Obtain an Import Declaration Form (IDF) number", description: "Lodge an IDF via the Single Window System for each shipment — required before goods arrive at the port.", agencyCode: "KENTRADE", fees: "~2.25% of CIF value (min. KES 5,000)", estimatedDays: 2 },
      { order: 5, title: "Arrange customs clearance on arrival", description: "See the separate 'Clear Goods Through Customs' procedure once your shipment reaches the port or border post.", estimatedDays: 3 },
    ],
  },
  {
    slug: "register-general-exporter",
    title: "Register as an Exporter in Kenya",
    category: "export",
    sector: null,
    summary: "The baseline registration for anyone looking to export goods from Kenya.",
    leadAgency: "KEPROBA",
    estimatedTotalDays: 14,
    steps: [
      { order: 1, title: "Obtain a KRA PIN", description: "Required for all export customs declarations.", agencyCode: "KRA", estimatedDays: 1 },
      { order: 2, title: "Register with KEPROBA", description: "Register your business with the Kenya Export Promotion and Branding Agency for export support and market linkages.", agencyCode: "KEPROBA", documentsRequired: ["Business registration certificate", "KRA PIN"], estimatedDays: 5 },
      { order: 3, title: "Register on the Single Window System", description: "Create an exporter account with KenTrade to lodge export declarations.", agencyCode: "KENTRADE", estimatedDays: 3 },
      { order: 4, title: "Check sector-specific requirements", description: "Agricultural, textile, and other regulated categories have additional certification steps — see the sector-specific procedures.", estimatedDays: 1 },
      { order: 5, title: "Obtain a Certificate of Origin", description: "Required for most destination markets and to claim preferential tariff treatment under EAC/COMESA/AfCFTA/AGOA.", agencyCode: "KEPROBA", estimatedDays: 2 },
    ],
  },
  {
    slug: "import-agricultural-produce",
    title: "Import Agricultural Produce (incl. Coffee, Tea, Spices)",
    category: "import",
    sector: "Coffee & Tea",
    summary:
      "Additional phytosanitary and quality-control steps required on top of general importer registration when the product is a plant or plant product — this is what applies to importing something like raw coffee beans.",
    leadAgency: "KEPHIS",
    estimatedTotalDays: 15,
    steps: [
      { order: 1, title: "Complete general importer registration", description: "KRA PIN, Single Window account, and IDF as in the general import procedure.", estimatedDays: 10 },
      { order: 2, title: "Apply for a Phytosanitary Import Permit", description: "Required before shipment for any plant or plant product to confirm it's free of regulated pests.", agencyCode: "KEPHIS", documentsRequired: ["IDF number", "Supplier/origin details"], estimatedDays: 5 },
      { order: 3, title: "Confirm AFA authorization for the specific crop", description: "The Agriculture and Food Authority regulates specific crop categories (coffee, tea, sugar, etc.) and may require an additional import authorization.", agencyCode: "AFA", estimatedDays: 3 },
      { order: 4, title: "Phytosanitary inspection on arrival", description: "KEPHIS inspects the consignment at the port of entry before it's released.", agencyCode: "KEPHIS", estimatedDays: 2 },
      { order: 5, title: "Customs clearance", description: "Standard customs clearance once phytosanitary and AFA clearance are obtained.", agencyCode: "KRA", estimatedDays: 3 },
    ],
  },
  {
    slug: "export-coffee",
    title: "Export Coffee from Kenya",
    category: "export",
    sector: "Coffee & Tea",
    summary: "Kenya's coffee export chain runs through the Coffee Directorate (under AFA) in addition to general exporter registration.",
    leadAgency: "AFA",
    estimatedTotalDays: 20,
    steps: [
      { order: 1, title: "Complete general exporter registration", description: "KRA PIN, KEPROBA registration, Single Window account.", estimatedDays: 14 },
      { order: 2, title: "Register as a licensed coffee dealer/exporter", description: "Obtain a coffee trading license from the Coffee Directorate (AFA).", agencyCode: "AFA", documentsRequired: ["Business registration certificate", "KRA PIN"], estimatedDays: 10 },
      { order: 3, title: "Source through the Nairobi Coffee Exchange or direct sale contract", description: "Most Kenyan coffee is sold via the weekly NCE auction; direct sales require a Coffee Directorate-approved contract.", estimatedDays: 7 },
      { order: 4, title: "Obtain grading and quality certification", description: "Coffee is graded by size and quality (e.g., AA, AB, PB) — required for export documentation.", agencyCode: "AFA", estimatedDays: 3 },
      { order: 5, title: "Obtain a Certificate of Origin and phytosanitary certificate", description: "Required for customs clearance at destination and to claim preferential tariffs where applicable.", agencyCode: "KEPHIS", estimatedDays: 3 },
      { order: 6, title: "Customs clearance and shipment", description: "Standard export customs clearance via KRA/KenTrade.", agencyCode: "KRA", estimatedDays: 3 },
    ],
  },
  {
    slug: "kebs-standardization-mark",
    title: "Obtain a KEBS Standardization Mark (Diamond Mark)",
    category: "certification",
    sector: null,
    summary: "Quality certification required for many manufactured and processed goods sold in or exported from Kenya.",
    leadAgency: "KEBS",
    estimatedTotalDays: 30,
    steps: [
      { order: 1, title: "Submit an application to KEBS", description: "Apply for the Standardization Mark (locally manufactured goods) or a Certificate of Conformity (imports) for your product category.", agencyCode: "KEBS", estimatedDays: 5 },
      { order: 2, title: "Factory/product inspection", description: "KEBS inspects the production facility and/or tests product samples against the relevant Kenya Standard.", agencyCode: "KEBS", estimatedDays: 15 },
      { order: 3, title: "Laboratory testing", description: "Samples are tested at a KEBS-accredited lab; non-conforming products must be corrected and resubmitted.", agencyCode: "KEBS", estimatedDays: 7 },
      { order: 4, title: "Certificate issuance", description: "Once compliant, KEBS issues the mark/certificate, valid for a fixed period subject to surveillance audits.", agencyCode: "KEBS", estimatedDays: 3 },
    ],
  },
  {
    slug: "kentrade-single-window-registration",
    title: "Register on the Kenya National Electronic Single Window System",
    category: "licensing",
    sector: null,
    summary: "The Single Window System (operated by KenTrade) is the shared digital gateway every importer/exporter uses to interact with customs and regulatory agencies in one place.",
    leadAgency: "KENTRADE",
    estimatedTotalDays: 5,
    steps: [
      { order: 1, title: "Create an account", description: "Register online with a valid KRA PIN and business registration details.", agencyCode: "KENTRADE", estimatedDays: 1 },
      { order: 2, title: "Verification", description: "KenTrade verifies your business details against KRA and Registrar of Companies records.", agencyCode: "KENTRADE", estimatedDays: 3 },
      { order: 3, title: "Account activation", description: "Once verified, you can lodge IDFs, permits, and declarations electronically.", agencyCode: "KENTRADE", estimatedDays: 1 },
    ],
  },
  {
    slug: "epz-license",
    title: "Apply for an Export Processing Zone (EPZ) License",
    category: "licensing",
    sector: "Manufacturing (General)",
    summary: "For manufacturers who want to operate inside a designated Export Processing Zone, with tax incentives tied to export-oriented production.",
    leadAgency: "EPZA",
    estimatedTotalDays: 45,
    steps: [
      { order: 1, title: "Submit an EPZ enterprise application", description: "Include a business plan showing export orientation (typically 80%+ of output exported).", agencyCode: "EPZA", estimatedDays: 10 },
      { order: 2, title: "Site inspection and approval", description: "EPZA reviews the proposed or existing zone premises.", agencyCode: "EPZA", estimatedDays: 20 },
      { order: 3, title: "Licensing and gazettement", description: "Approved enterprises are licensed and, if operating a private zone, gazetted as an EPZ.", agencyCode: "EPZA", estimatedDays: 15 },
    ],
  },
  {
    slug: "customs-clearance-port-of-mombasa",
    title: "Clear Goods Through Customs at the Port of Mombasa",
    category: "customs",
    sector: null,
    summary: "The step-by-step process once a shipment physically arrives, applicable to most import flows.",
    leadAgency: "KRA",
    estimatedTotalDays: 5,
    steps: [
      { order: 1, title: "Pre-arrival declaration", description: "Lodge the customs entry (based on your IDF) before or on vessel arrival via the Single Window System.", agencyCode: "KENTRADE", estimatedDays: 1 },
      { order: 2, title: "Cargo manifest and berthing", description: "Kenya Ports Authority processes the vessel manifest and assigns berthing/container yard space.", agencyCode: "KPA", estimatedDays: 1 },
      { order: 3, title: "Customs verification/scanning", description: "KRA scans or physically inspects a risk-selected subset of consignments.", agencyCode: "KRA", estimatedDays: 1 },
      { order: 4, title: "Duty and tax assessment and payment", description: "Import duty (per the applicable tariff line), VAT, and any excise are assessed and paid.", agencyCode: "KRA", estimatedDays: 1 },
      { order: 5, title: "Release and gate-out", description: "Once duties are paid and any regulatory holds (KEBS/KEPHIS/AFA) are cleared, KPA releases the cargo.", agencyCode: "KPA", estimatedDays: 1 },
    ],
  },
  {
    slug: "import-textiles-pvoc",
    title: "Import Textiles and Apparel (PVoC)",
    category: "import",
    sector: "Textiles & Apparel",
    summary: "Textiles and apparel require Pre-Export Verification of Conformity before shipment, on top of general import registration.",
    leadAgency: "KEBS",
    estimatedTotalDays: 20,
    steps: [
      { order: 1, title: "Complete general importer registration", description: "KRA PIN, Single Window account, IDF.", estimatedDays: 10 },
      { order: 2, title: "Register for PVoC with a KEBS-appointed inspection agent", description: "Required before shipment from the country of origin.", agencyCode: "KEBS", estimatedDays: 5 },
      { order: 3, title: "Pre-shipment inspection and testing", description: "The appointed agent inspects/tests the goods at origin and issues a Certificate of Conformity.", agencyCode: "KEBS", estimatedDays: 7 },
      { order: 4, title: "Customs clearance", description: "The Certificate of Conformity is presented at clearance; goods without it are held or re-routed for destination inspection at a higher fee.", agencyCode: "KRA", estimatedDays: 3 },
    ],
  },
  {
    slug: "understand-import-duty-vat",
    title: "Understand and Calculate Import Duty & VAT",
    category: "customs",
    sector: null,
    summary: "A walkthrough of how landed cost is actually calculated, so you can budget before you order.",
    leadAgency: "KRA",
    estimatedTotalDays: 1,
    steps: [
      { order: 1, title: "Find your HS code and applicable tariff rate", description: "Use the Market & Product Explorer — check both the MFN rate and any preferential rate your origin country qualifies for (EAC/COMESA/AfCFTA/AGOA/etc.).", estimatedDays: 1 },
      { order: 2, title: "Determine the customs value (CIF)", description: "Cost, Insurance, and Freight value of the goods — the base for duty calculation.", estimatedDays: 1 },
      { order: 3, title: "Calculate import duty", description: "Import duty = CIF value × applicable tariff rate.", estimatedDays: 1 },
      { order: 4, title: "Calculate VAT and other levies", description: "VAT (standard 16%) is charged on CIF + duty; some categories carry additional excise duty or import declaration/railway development levies.", agencyCode: "KRA", estimatedDays: 1 },
      { order: 5, title: "Total landed cost", description: "CIF value + duty + VAT + levies + local port/clearing agent charges.", estimatedDays: 1 },
    ],
  },
];

export async function seedProcedures(
  sectorIdByName: Map<string, number>,
  agencyIdByCode: Map<string, number>,
) {
  console.log("Seeding procedures (getting-started guidance)...");

  const rows = PROCEDURE_SEEDS.map((p) => {
    const leadAgencyId = agencyIdByCode.get(p.leadAgency);
    if (!leadAgencyId) throw new Error(`Unknown lead agency code: ${p.leadAgency}`);
    return {
      slug: p.slug,
      title: p.title,
      category: p.category,
      sectorId: p.sector ? sectorIdByName.get(p.sector) ?? null : null,
      summary: p.summary,
      steps: p.steps,
      leadAgencyId,
      estimatedTotalDays: p.estimatedTotalDays,
    };
  });

  const inserted = await db.insert(procedures).values(rows).onConflictDoNothing().returning();
  console.log(`  procedures: ${inserted.length} / ${rows.length}`);
  return inserted.length;
}

export async function ensureKephisAgency(agencyIdByCode: Map<string, number>) {
  if (agencyIdByCode.has("KEPHIS")) return;
  const [row] = await db
    .insert(agencies)
    .values({
      code: "KEPHIS",
      name: "Kenya Plant Health Inspectorate Service",
      description: "Phytosanitary inspection and certification for plant and plant-product imports and exports.",
    })
    .onConflictDoNothing()
    .returning();
  if (row) agencyIdByCode.set(row.code, row.id);
}
