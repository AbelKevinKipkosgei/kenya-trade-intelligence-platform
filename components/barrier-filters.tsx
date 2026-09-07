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
    "border border-zinc-400 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-kenya-green sm:text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50";

  return (
    <div className="flex flex-wrap gap-2">
      <select value={selectedStatus} onChange={(e) => updateParam("status", e.target.value)} className={selectClass}>
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select value={selectedType} onChange={(e) => updateParam("type", e.target.value)} className={selectClass}>
        {TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select value={selectedSector} onChange={(e) => updateParam("sector", e.target.value)} className={selectClass}>
        <option value="">All sectors</option>
        {sectors.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <select value={selectedCountry} onChange={(e) => updateParam("country", e.target.value)} className={selectClass}>
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
