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
    "rounded-full border border-stone-400 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-kenya-green dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50";

  return (
    <div className="flex flex-wrap gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParams({ q: query });
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by company name…"
          className="w-56 rounded-full border border-stone-400 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-kenya-green dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
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
