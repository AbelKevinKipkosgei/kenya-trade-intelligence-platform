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
    "border border-zinc-400 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-kenya-green sm:text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50";

  return (
    <div className="flex w-full flex-wrap gap-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products or HS codes"
        aria-label="Search products or HS codes"
        className={`${selectClass} order-first min-w-60 flex-1 sm:order-0`}
      />
      <select
        value={selectedPeriod}
        onChange={(e) => updateParam("period", e.target.value)}
        className={selectClass}
      >
        {periods.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <select
        value={selectedSector}
        onChange={(e) => updateParam("sector", e.target.value)}
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
        value={selectedCountry}
        onChange={(e) => updateParam("country", e.target.value)}
        className={selectClass}
      >
        <option value="">All markets</option>
        {countries.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
