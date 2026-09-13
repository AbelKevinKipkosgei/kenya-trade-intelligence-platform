"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { value: string; label: string };

export function ExporterFilters({
  sectors,
  counties,
  selectedSector,
  selectedCounty,
  selectedExportReady,
  selectedQuery,
}: {
  sectors: Option[];
  counties: Option[];
  selectedSector: string;
  selectedCounty: string;
  selectedExportReady: string;
  selectedQuery: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(selectedQuery);

  function updateParams(overrides: Record<string, string>) {
    const params = new URLSearchParams({
      sector: selectedSector,
      county: selectedCounty,
      exportReady: selectedExportReady,
      q: query,
      ...overrides,
    });
    for (const [key, value] of [...params.entries()]) {
      if (!value) params.delete(key);
    }
    router.push(`/exporters?${params.toString()}`);
  }

  const selectClass =
    "h-10 w-full appearance-none border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none transition-colors focus:border-kenya-green focus:ring-2 focus:ring-kenya-green/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 sm:min-w-40";

  return (
    <div className="grid w-full grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_1px_3px_rgba(16,42,67,0.04)] dark:border-zinc-700 dark:bg-zinc-900 sm:grid-cols-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParams({ q: query });
        }}
        className="w-full sm:w-auto"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by company name…"
          className="h-10 w-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-colors focus:border-kenya-green focus:ring-2 focus:ring-kenya-green/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 sm:w-56 sm:text-xs"
        />
      </form>
      <select
        value={selectedSector}
        onChange={(e) => updateParams({ sector: e.target.value })}
        className={selectClass}
      >
        <option value="">All sectors</option>
        {sectors.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <select
        value={selectedCounty}
        onChange={(e) => updateParams({ county: e.target.value })}
        className={selectClass}
      >
        <option value="">All counties</option>
        {counties.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <select
        value={selectedExportReady}
        onChange={(e) => updateParams({ exportReady: e.target.value })}
        className={selectClass}
      >
        <option value="">All exporters</option>
        <option value="true">Export-ready only</option>
        <option value="false">Not yet export-ready</option>
      </select>
    </div>
  );
}
