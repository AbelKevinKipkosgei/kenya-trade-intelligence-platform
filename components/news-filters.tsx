"use client";

import { useRouter } from "next/navigation";

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
}: {
  countries: Option[];
  selectedCategory: string;
  selectedCountry: string;
}) {
  const router = useRouter();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams({
      category: selectedCategory,
      country: selectedCountry,
    });
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/news?${params.toString()}`);
  }

  const selectClass =
    "rounded-full border border-stone-400 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-kenya-green dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50";

  return (
    <div className="flex flex-wrap gap-2">
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
