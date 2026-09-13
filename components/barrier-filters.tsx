"use client";

import { useRouter } from "next/navigation";

type Option = { value: string; label: string };

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "monitoring", label: "Monitoring" },
  { value: "resolved", label: "Resolved" },
  { value: "", label: "All statuses" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "non_tariff", label: "Non-tariff" },
  { value: "sps", label: "SPS" },
  { value: "technical", label: "Technical" },
  { value: "quota", label: "Quota" },
  { value: "licensing", label: "Licensing" },
];

export function BarrierFilters({
  sectors,
  countries,
  selectedStatus,
  selectedType,
  selectedSector,
  selectedCountry,
}: {
  sectors: Option[];
  countries: Option[];
  selectedStatus: string;
  selectedType: string;
  selectedSector: string;
  selectedCountry: string;
}) {
  const router = useRouter();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams({
      status: selectedStatus,
      type: selectedType,
      sector: selectedSector,
      country: selectedCountry,
    });
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/barriers?${params.toString()}`);
  }

  const selectClass =
    "h-10 w-full appearance-none border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none transition-colors focus:border-kenya-green focus:ring-2 focus:ring-kenya-green/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 sm:min-w-40";

  return (
    <div className="grid w-full grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_1px_3px_rgba(16,42,67,0.04)] dark:border-zinc-700 dark:bg-zinc-900 sm:grid-cols-4">
      <select
        value={selectedStatus}
        onChange={(e) => updateParam("status", e.target.value)}
        className={selectClass}
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={selectedType}
        onChange={(e) => updateParam("type", e.target.value)}
        className={selectClass}
        aria-label="Filter by barrier type"
      >
        {TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={selectedSector}
        onChange={(e) => updateParam("sector", e.target.value)}
        className={selectClass}
        aria-label="Filter by sector"
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
        aria-label="Filter by market"
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
