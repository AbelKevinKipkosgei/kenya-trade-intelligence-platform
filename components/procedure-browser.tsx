"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ProcedureStep } from "@/db/schema";

type Procedure = {
  id: number;
  title: string;
  category: string;
  summary: string;
  steps: ProcedureStep[];
  estimatedTotalDays: number | null;
  sectorName: string | null;
  leadAgencyName: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  import: "Importing",
  export: "Exporting",
  certification: "Certification",
  licensing: "Licensing",
  customs: "Customs & Duties",
};

const CATEGORY_ORDER = ["import", "export", "certification", "licensing", "customs"];

const CATEGORY_STYLES: Record<string, { text: string; bg: string; border: string }> = {
  import: { text: "text-ktp-navy dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-ktp-navy" },
  export: { text: "text-kenya-green", bg: "bg-kenya-green/10", border: "border-kenya-green" },
  certification: { text: "text-ktp-amber dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-ktp-amber" },
  licensing: { text: "text-violet-700 dark:text-violet-300", bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-700" },
  customs: { text: "text-kenya-red", bg: "bg-kenya-red/10", border: "border-kenya-red" },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  import: <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />,
  export: <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 7.5L12 3m0 0l4.5 4.5M12 3v13.5" />,
  certification: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043A3.746 3.746 0 015.593 8.932 3.746 3.746 0 016.636 5.636a3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043a3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />,
  licensing: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-1.125 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-1.125-1.125-1.125-1.125H3.375z" />,
  customs: <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v9m3.75-9v9M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.625c.621 0 1.125 1.125 1.125 1.125v.375M18.75 4.5v.75c0 .414.336.75.75.75h.75M4.5 6.75h15v9a2.25 2.25 0 01-2.25 2.25h-10.5A2.25 2.25 0 014.5 15.75v-9z" />,
};

function ProcedureCard({ procedure, open, onToggle }: { procedure: Procedure; open: boolean; onToggle: () => void }) {
  const style = CATEGORY_STYLES[procedure.category] ?? CATEGORY_STYLES.import;
  const steps = [...procedure.steps].sort((a, b) => a.order - b.order);

  return (
    <article className={`overflow-hidden border transition-colors ${open ? `border-l-4 ${style.border} ${style.bg}` : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-kenya-red dark:hover:bg-zinc-800 sm:p-5">
        <span className="min-w-0">
          <span className="block text-base font-semibold text-zinc-950 dark:text-zinc-50">{procedure.title}</span>
          <span className="mt-2 flex flex-wrap items-center gap-2">
            <span className="border border-zinc-300 bg-zinc-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{procedure.leadAgencyName}</span>
            {procedure.sectorName && <span className="border border-zinc-300 bg-zinc-100 px-2 py-1 text-[11px] font-semibold text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{procedure.sectorName}</span>}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          {procedure.estimatedTotalDays && <span className={`border px-2 py-1 text-xs font-semibold ${style.text} ${style.bg} ${style.border}`}>~{procedure.estimatedTotalDays} days</span>}
          <span aria-hidden="true" className="text-xl leading-none text-zinc-500">{open ? "−" : "+"}</span>
        </span>
      </button>

      {open && (
        <div className="border-t border-zinc-200 px-4 pb-5 pt-4 dark:border-zinc-700 sm:px-5">
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{procedure.summary}</p>
          <ol className="mt-5 flex flex-col">
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              const hasMeta = !!step.documentsRequired?.length || !!step.fees || !!step.estimatedDays;
              return (
                <li key={step.order} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-kenya-green text-[11px] font-semibold text-white">{step.order}</span>
                    {!isLast && <span className="mt-1 w-px flex-1 bg-kenya-green/25" />}
                  </div>
                  <div className={isLast ? "pb-0.5" : "pb-4"}>
                    <div className="pt-0.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">{step.title}</div>
                    <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{step.description}</p>
                    {hasMeta && <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {step.documentsRequired?.length ? <span className="border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">Documents: {step.documentsRequired.join(", ")}</span> : null}
                      {step.fees ? <span className="border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">Fees: {step.fees}</span> : null}
                      {step.estimatedDays ? <span className="border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">~{step.estimatedDays} days</span> : null}
                    </div>}
                  </div>
                </li>
              );
            })}
          </ol>
          <button type="button" onClick={onToggle} className="mt-4 text-xs font-semibold text-kenya-green hover:underline">Collapse procedure</button>
        </div>
      )}
    </article>
  );
}

export function ProcedureBrowser({ procedures }: { procedures: Procedure[] }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [direction, setDirection] = useState<"all" | "import" | "export">("all");
  const [sector, setSector] = useState("all");
  const [guided, setGuided] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const firstMatchRef = useRef<HTMLDivElement | null>(null);

  const categories = useMemo(() => CATEGORY_ORDER.filter((category) => procedures.some((procedure) => procedure.category === category)), [procedures]);
  const sectors = useMemo(() => [...new Set(procedures.map((procedure) => procedure.sectorName).filter(Boolean) as string[])].sort(), [procedures]);

  const visibleProcedures = useMemo(() => {
    let filtered = procedures;
    if (selectedCategory !== "all") filtered = filtered.filter((procedure) => procedure.category === selectedCategory);
    if (guided && direction !== "all") filtered = filtered.filter((procedure) => procedure.category === direction);
    if (guided && sector !== "all") filtered = filtered.filter((procedure) => procedure.sectorName === sector || !procedure.sectorName);
    return guided ? filtered.slice(0, 2) : filtered;
  }, [procedures, selectedCategory, guided, direction, sector]);

  // Scrolling to the first guided match is the only genuine effect here —
  // collapsing an open card is a direct reaction to a filter change, so
  // that reset lives in the event handlers below instead (chooseGuidedDirection,
  // chooseGuidedSector, browseAll, and the category button already do this).
  useEffect(() => {
    if (!guided || visibleProcedures.length === 0) return;
    const timer = window.setTimeout(() => firstMatchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    return () => window.clearTimeout(timer);
  }, [guided, direction, sector, selectedCategory, visibleProcedures.length]);

  function chooseGuidedDirection(value: "all" | "import" | "export") {
    setGuided(true);
    setDirection(value);
    setSelectedCategory("all");
    setOpenId(null);
  }

  function chooseGuidedSector(value: string) {
    setGuided(true);
    setSector(value);
    setSelectedCategory("all");
    setOpenId(null);
  }

  function browseAll() {
    setGuided(false);
    setDirection("all");
    setSector("all");
    setSelectedCategory("all");
    setOpenId(null);
  }

  return (
    <>
      <div className="mb-8 border-t-4 border-ktp-navy bg-ktp-surface p-5 dark:bg-zinc-900 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-ktp-navy dark:text-zinc-300">Find your starting point</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Are you importing or exporting?</legend>
            <div className="flex flex-wrap gap-2">
              {[['import', 'Importing'], ['export', 'Exporting']].map(([value, label]) => (
                <button key={value} type="button" onClick={() => chooseGuidedDirection(value as "import" | "export")} className={`border px-3 py-2 text-sm font-semibold ${guided && direction === value ? "border-ktp-navy bg-ktp-navy text-white" : "border-zinc-400 bg-white text-zinc-700 hover:border-ktp-navy dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-300"}`}>{label}</button>
              ))}
            </div>
          </fieldset>
          <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <span className="mb-2 block">What product category?</span>
            <select value={guided ? sector : "all"} onChange={(event) => chooseGuidedSector(event.target.value)} className="w-full border border-zinc-400 bg-white px-3 py-2 font-normal text-zinc-900 outline-none focus:border-kenya-green dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100">
              <option value="all">Choose a category</option>
              {sectors.map((option) => <option key={option} value={option}>{option}</option>)}
              <option value="general">General procedures</option>
            </select>
          </label>
        </div>
        {guided && <p className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">Showing up to two procedures matching your answers. Choose another answer to refine the results.</p>}
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2" aria-label="Procedure categories">
        <button type="button" onClick={browseAll} className={`border px-3 py-1.5 text-xs font-semibold ${!guided && selectedCategory === "all" ? "border-ktp-navy bg-ktp-navy text-white" : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"}`}>All <span className="ml-1 opacity-70">{procedures.length}</span></button>
        {categories.map((category) => {
          const style = CATEGORY_STYLES[category];
          const active = !guided && selectedCategory === category;
          return <button key={category} type="button" onClick={() => { setGuided(false); setDirection("all"); setSector("all"); setSelectedCategory(category); setOpenId(null); }} className={`border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? `${style.border} ${style.bg} ${style.text}` : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"}`}>{CATEGORY_LABELS[category]} <span className="ml-1 opacity-60">{procedures.filter((procedure) => procedure.category === category).length}</span></button>;
        })}
        {guided && <button type="button" onClick={browseAll} className="ml-1 text-xs font-semibold text-kenya-green underline underline-offset-2">Browse all procedures instead</button>}
      </div>

      <div className="flex flex-col gap-8">
        {categories.filter((category) => visibleProcedures.some((procedure) => procedure.category === category)).map((category) => {
          const style = CATEGORY_STYLES[category];
          const categoryProcedures = visibleProcedures.filter((procedure) => procedure.category === category);
          return <section key={category} id={category} className="scroll-mt-6"><div className="mb-3 flex items-center gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center border ${style.bg} ${style.text} ${style.border}`}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{CATEGORY_ICONS[category]}</svg></span><h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{CATEGORY_LABELS[category]}</h2><span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{categoryProcedures.length} {categoryProcedures.length === 1 ? "procedure" : "procedures"}</span></div><div className="flex flex-col gap-3">{categoryProcedures.map((procedure, index) => <div key={procedure.id} ref={index === 0 && guided ? firstMatchRef : undefined}><ProcedureCard procedure={procedure} open={openId === procedure.id} onToggle={() => setOpenId(openId === procedure.id ? null : procedure.id)} /></div>)}</div></section>;
        })}
        {visibleProcedures.length === 0 && <p className="border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">No procedures match both selections. Try another category or browse all procedures.</p>}
      </div>
    </>
  );
}
