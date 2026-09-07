import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { procedures, sectors, agencies, type ProcedureStep } from "@/db/schema";
import { ProcedureBrowser } from "@/components/procedure-browser";

export const revalidate = 3600;

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

  const agencyCount = new Set(rows.map((r) => r.leadAgencyName)).size;

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
      <ProcedureBrowser procedures={rows.map((row) => ({ ...row, steps: row.steps as ProcedureStep[] }))} />
    </div>
  );
}
