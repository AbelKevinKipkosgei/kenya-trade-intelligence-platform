"use client";

import { useRouter } from "next/navigation";

type Option = { value: string; label: string };

export function LeaderboardFilters({
  sectors,
  countries,
  periods,
  selectedSector,
  selectedCountry,
  selectedPeriod,
}: {
  sectors: Option[];
  countries: Option[];
  periods: Option[];
  selectedSector: string;
  selectedCountry: string;
  selectedPeriod: string;
}) {
  const router = useRouter();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams({
      sector: selectedSector,
      country: selectedCountry,
      period: selectedPeriod,
    });
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/opportunities?${params.toString()}`);
  }

  const selectClass =
    "border border-zinc-400 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-kenya-green sm:text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50";

  return (
    <div className="flex flex-wrap gap-2">
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
