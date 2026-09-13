"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Option = { value: string; label: string };

export function LeaderboardFilters({
  sectors,
  countries,
  periods,
  selectedSector,
  selectedCountry,
  selectedPeriod,
  productSearch,
}: {
  sectors: Option[];
  countries: Option[];
  periods: Option[];
  selectedSector: string;
  selectedCountry: string;
  selectedPeriod: string;
  productSearch: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(productSearch);
  // Tracks whether `query` changed locally (typing) vs. arrived from a
  // fresh server render (e.g. the sector/country/period selects below
  // triggering a navigation) — without this, a select-driven navigation
  // would replay this effect and re-push the same search param.
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      const params = new URLSearchParams({
        sector: selectedSector,
        country: selectedCountry,
        period: selectedPeriod,
      });
      if (query.trim()) params.set("search", query.trim());
      router.replace(`/opportunities?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams({
      sector: selectedSector,
      country: selectedCountry,
      period: selectedPeriod,
    });
    if (query.trim()) params.set("search", query.trim());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/opportunities?${params.toString()}`);
  }

  const selectClass =
    "h-10 w-full appearance-none border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none transition-colors focus:border-kenya-green focus:ring-2 focus:ring-kenya-green/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 sm:w-auto sm:min-w-44";

  return (
    <div className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_1px_3px_rgba(16,42,67,0.04)] dark:border-zinc-700 dark:bg-zinc-900 sm:flex-row sm:items-center">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Search products or HS codes</span>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products or HS codes..."
          aria-label="Search products or HS codes"
          className="h-10 w-full border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none transition-colors focus:border-kenya-green focus:ring-2 focus:ring-kenya-green/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        />
      </label>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
        <select value={selectedPeriod} onChange={(e) => updateParam("period", e.target.value)} className={selectClass} aria-label="Select period">
          {periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={selectedSector} onChange={(e) => updateParam("sector", e.target.value)} className={selectClass} aria-label="Select sector">
          <option value="">All sectors</option>
          {sectors.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={selectedCountry} onChange={(e) => updateParam("country", e.target.value)} className={selectClass} aria-label="Select destination market">
          <option value="">All markets</option>
          {countries.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
    </div>
  );
}
