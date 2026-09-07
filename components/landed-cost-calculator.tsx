"use client";

import { useMemo, useState } from "react";

type TariffOption = {
  countryName: string;
  ratePercent: number;
  rateType: string;
  agreementCode: string | null;
};

function formatUsd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

export function LandedCostCalculator({ rows }: { rows: TariffOption[] }) {
  // A market can have more than one tariff row (e.g. MFN and a preferential
  // rate under an agreement) — the rate an exporter would actually pay is
  // the lowest one they qualify for, same logic the scoring engine uses.
  const bestByMarket = useMemo(() => {
    const map = new Map<string, TariffOption>();
    for (const row of rows) {
      const existing = map.get(row.countryName);
      if (!existing || row.ratePercent < existing.ratePercent) map.set(row.countryName, row);
    }
    return [...map.values()].sort((a, b) => a.countryName.localeCompare(b.countryName));
  }, [rows]);

  const [countryName, setCountryName] = useState(bestByMarket[0]?.countryName ?? "");
  const [value, setValue] = useState("10000");

  const selected = bestByMarket.find((m) => m.countryName === countryName) ?? bestByMarket[0];
  const declaredValue = Number(value);
  const isValid = Number.isFinite(declaredValue) && declaredValue >= 0 && !!selected;
  const duty = isValid ? declaredValue * (selected!.ratePercent / 100) : 0;
  const total = isValid ? declaredValue + duty : 0;

  if (bestByMarket.length === 0) return null;

  const selectClass =
    "rounded-full border border-stone-400 bg-white px-3 py-2 text-base sm:text-xs text-zinc-900 outline-none focus:border-kenya-green dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50";

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Destination market</span>
          <select value={countryName} onChange={(e) => setCountryName(e.target.value)} className={selectClass}>
            {bestByMarket.map((m) => (
              <option key={m.countryName} value={m.countryName}>
                {m.countryName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Declared value (USD)</span>
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-40 rounded-full border border-stone-400 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-kenya-green dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 sm:text-xs"
          />
        </label>
      </div>

      {isValid && selected && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-stone-100 p-3 dark:bg-zinc-700/50">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Applicable rate
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {selected.ratePercent.toFixed(1)}%
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {selected.rateType}
              {selected.agreementCode ? ` · ${selected.agreementCode}` : ""}
            </p>
          </div>
          <div className="rounded-xl bg-stone-100 p-3 dark:bg-zinc-700/50">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Import duty
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{formatUsd(duty)}</p>
          </div>
          <div className="rounded-xl bg-kenya-green/10 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-kenya-green">
              Estimated landed cost
            </p>
            <p className="mt-1 text-lg font-semibold text-kenya-green">{formatUsd(total)}</p>
          </div>
        </div>
      )}

      <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">
        Estimate covers import duty at the best applicable tariff rate only. It does not include
        freight, insurance, or other agency fees, which aren&apos;t modeled in this dataset.
      </p>
    </div>
  );
}
