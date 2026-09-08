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

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams({
      sector: selectedSector,
      country: selectedCountry,
      period: selectedPeriod,
    });
    if (productSearch) params.set("search", productSearch);
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/opportunities?${params.toString()}`);
  }

  function searchProducts(formData: FormData) {
    const params = new URLSearchParams({
      sector: selectedSector,
      country: selectedCountry,
      period: selectedPeriod,
    });
    const search = String(formData.get("search") ?? "").trim();
    if (search) params.set("search", search);
    router.push(`/opportunities?${params.toString()}`);
  }

  const selectClass =
    "border border-zinc-400 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-kenya-green sm:text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50";

  return (
    <div className="flex flex-wrap gap-2">
      <form action={searchProducts} className="order-first flex min-w-60 flex-1 sm:order-0 sm:flex-none">
        <input
          type="search"
          name="search"
          defaultValue={productSearch}
          placeholder="Search products or HS codes"
          aria-label="Search products or HS codes"
          className={`${selectClass} w-full`}
        />
      </form>
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
