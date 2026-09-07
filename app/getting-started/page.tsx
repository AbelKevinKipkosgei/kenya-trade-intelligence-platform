import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { procedures, sectors, agencies, type ProcedureStep } from "@/db/schema";
import { ProcedureBrowser } from "@/components/procedure-browser";

export const revalidate = 3600;

const CATEGORY_LABELS: Record<string, string> = {
  import: "Importing",
  export: "Exporting",
  certification: "Certification",
  licensing: "Licensing",
  customs: "Customs & Duties",
};

const CATEGORY_ORDER = [
  "import",
  "export",
  "certification",
  "licensing",
  "customs",
];

const CATEGORY_STYLES: Record<string, { text: string; bg: string; cardHover: string }> = {
  import: { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", cardHover: "hover:ring-blue-500/30" },
  export: { text: "text-kenya-green", bg: "bg-kenya-green/10", cardHover: "hover:ring-kenya-green/30" },
  certification: {
    text: "text-amber-700 dark:text-amber-500",
    bg: "bg-amber-500/10",
    cardHover: "hover:ring-amber-500/30",
  },
  licensing: {
    text: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    cardHover: "hover:ring-violet-500/30",
  },
  customs: { text: "text-kenya-red", bg: "bg-kenya-red/10", cardHover: "hover:ring-kenya-red/30" },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  import: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  ),
  export: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 7.5L12 3m0 0l4.5 4.5M12 3v13.5"
    />
  ),
  certification: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
    />
  ),
  licensing: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"
    />
  ),
  customs: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 7.5v9m3.75-9v9M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.625c.621 0 1.125.504 1.125 1.125v.375M18.75 4.5v.75c0 .414.336.75.75.75h.75M4.5 6.75h15v9a2.25 2.25 0 01-2.25 2.25h-10.5A2.25 2.25 0 014.5 15.75v-9z"
    />
  ),
};

export default async function GettingStartedPage() {
  const rows = await db
    .select({
      id: procedures.id,
      title: procedures.title,
      category: procedures.category,
      summary: procedures.summary,
      steps: procedures.steps,
      estimatedTotalDays: procedures.estimatedTotalDays,
      sectorName: sectors.name,
      leadAgencyName: agencies.name,
    })
    .from(procedures)
    .leftJoin(sectors, eq(sectors.id, procedures.sectorId))
    .innerJoin(agencies, eq(agencies.id, procedures.leadAgencyId))
    .orderBy(procedures.title);

  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    if (!grouped.has(row.category)) grouped.set(row.category, []);
    grouped.get(row.category)!.push(row);
  }

  const agencyCount = new Set(rows.map((r) => r.leadAgencyName)).size;
  const presentCategories = CATEGORY_ORDER.filter((c) => grouped.has(c));

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-1 flex-col px-6 py-10 sm:px-10">
      <div className="mb-8">
        <span className="inline-flex border border-kenya-green/40 bg-kenya-green/10 px-3 py-1 text-xs font-semibold text-kenya-green">
          {rows.length} procedures across {agencyCount} agencies
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Getting Started</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Step-by-step procedures across Kenya&apos;s trade agencies. Ask the{" "}
          <a href="/analyst" className="font-medium text-kenya-green hover:underline">AI Trade Analyst</a>{" "}
          if you want this walked through for your specific product.
        </p>
      </div>
      <ProcedureBrowser procedures={rows.map((row) => ({ ...row, steps: row.steps as ProcedureStep[] }))} agencyCount={agencyCount} />
    </div>
  );
}
