"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Option = { value: string; label: string };

const CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  { value: "tariff", label: "Tariff" },
  { value: "agreement", label: "Agreement" },
  { value: "market", label: "Market" },
  { value: "policy", label: "Policy" },
  { value: "logistics", label: "Logistics" },
];

export function NewsFilters({
  countries,
  selectedCategory,
  selectedCountry,
  selectedSearch,
}: {
  countries: Option[];
  selectedCategory: string;
  selectedCountry: string;
  selectedSearch: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(selectedSearch);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim() === selectedSearch) return;
      const params = new URLSearchParams({
        category: selectedCategory,
        country: selectedCountry,
      });
      if (query.trim()) params.set("search", query.trim());
      router.replace(`/news?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, selectedSearch, selectedCategory, selectedCountry, router]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams({
      category: selectedCategory,
      country: selectedCountry,
      search: query,
    });
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/news?${params.toString()}`);
  }

  const selectClass =
    "h-10 w-full appearance-none border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none transition-colors focus:border-kenya-green focus:ring-2 focus:ring-kenya-green/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 sm:min-w-40";

  return (
    <div className="grid w-full grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_1px_3px_rgba(16,42,67,0.04)] dark:border-zinc-700 dark:bg-zinc-900 sm:grid-cols-[minmax(0,1fr)_10rem_10rem]">
      <label className="relative col-span-2 sm:col-span-1">
        <span className="sr-only">Search headlines, topics, or sources</span>
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search headlines, topics or sources..."
          aria-label="Search headlines, topics or sources"
          className="h-10 w-full border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-kenya-green focus:ring-2 focus:ring-kenya-green/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        />
      </label>
      <select
        value={selectedCategory}
        onChange={(e) => updateParam("category", e.target.value)}
        className={selectClass}
      >
        {CATEGORY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
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
