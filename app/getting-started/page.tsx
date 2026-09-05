import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { procedures, sectors, agencies, type ProcedureStep } from "@/db/schema";

export const revalidate = 3600;

const CATEGORY_LABELS: Record<string, string> = {
  import: "Importing",
  export: "Exporting",
  certification: "Certification",
  licensing: "Licensing",
  customs: "Customs & Duties",
};

const CATEGORY_ORDER = ["import", "export", "certification", "licensing", "customs"];

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

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-1 flex-col px-6 py-10 sm:px-10">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Getting Started
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Step-by-step procedures across Kenya&apos;s trade agencies — centralized here instead of
          scattered across each agency&apos;s own site. Ask the{" "}
          <a href="/analyst" className="font-medium text-kenya-green hover:underline">
            AI Trade Analyst
          </a>{" "}
          if you want this walked through for your specific product.
        </p>
      </div>

      <div className="flex flex-col gap-12">
        {CATEGORY_ORDER.filter((c) => grouped.has(c)).map((category) => (
          <section key={category}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {CATEGORY_LABELS[category] ?? category}
            </h2>
            <div className="flex flex-col gap-4">
              {grouped.get(category)!.map((proc) => (
                <article
                  key={proc.id}
                  className="rounded-2xl border border-stone-300 bg-white/70 p-5 dark:border-zinc-700 dark:bg-zinc-800/70"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                      {proc.title}
                    </h3>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Lead agency: {proc.leadAgencyName}
                      {proc.sectorName ? ` · ${proc.sectorName}` : ""}
                      {proc.estimatedTotalDays ? ` · ~${proc.estimatedTotalDays} days` : ""}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{proc.summary}</p>

                  <ol className="mt-4 flex flex-col gap-3 border-l-2 border-kenya-green/40 pl-4">
                    {(proc.steps as ProcedureStep[])
                      .sort((a, b) => a.order - b.order)
                      .map((step) => (
                        <li key={step.order}>
                          <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            {step.order}. {step.title}
                          </div>
                          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                            {step.description}
                          </p>
                          {(step.documentsRequired?.length || step.fees || step.estimatedDays) && (
                            <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-zinc-500 dark:text-zinc-500">
                              {step.documentsRequired?.length ? (
                                <span>Documents: {step.documentsRequired.join(", ")}</span>
                              ) : null}
                              {step.fees ? <span>Fees: {step.fees}</span> : null}
                              {step.estimatedDays ? <span>~{step.estimatedDays} days</span> : null}
                            </div>
                          )}
                        </li>
                      ))}
                  </ol>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
