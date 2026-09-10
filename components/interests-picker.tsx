"use client";

import { useState } from "react";

type Option = { id: number; name: string };
type Interest = { id: number; sectorId: number | null; countryId: number | null };

export function InterestsPicker({
  sectors,
  countries,
  initialInterests,
}: {
  sectors: Option[];
  countries: Option[];
  initialInterests: Interest[];
}) {
  const [interests, setInterests] = useState(initialInterests);
  const [countryToAdd, setCountryToAdd] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const followedSectorIds = new Set(interests.map((i) => i.sectorId).filter((id): id is number => id !== null));
  const followedCountryIds = new Set(interests.map((i) => i.countryId).filter((id): id is number => id !== null));
  const followedCountries = countries.filter((c) => followedCountryIds.has(c.id));
  const unfollowedCountries = countries.filter((c) => !followedCountryIds.has(c.id));

  async function toggle(key: string, body: { sectorId?: number; countryId?: number }) {
    setPending(key);
    try {
      const res = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return;
      const { following } = await res.json();
      if (following) {
        setInterests((prev) => [...prev, { id: -Date.now(), sectorId: body.sectorId ?? null, countryId: body.countryId ?? null }]);
      } else {
        setInterests((prev) =>
          prev.filter((i) => (body.sectorId ? i.sectorId !== body.sectorId : i.countryId !== body.countryId)),
        );
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-10">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
          Sectors
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {sectors.map((s) => {
            const following = followedSectorIds.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                disabled={pending === `sector-${s.id}`}
                onClick={() => toggle(`sector-${s.id}`, { sectorId: s.id })}
                className={
                  following
                    ? "rounded-full border border-kenya-green bg-kenya-green px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                    : "rounded-full border border-stone-400 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-kenya-green hover:text-kenya-green disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                }
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
          Markets
        </h2>
        <div className="mt-3 flex gap-2">
          <select
            value={countryToAdd}
            onChange={(e) => setCountryToAdd(e.target.value)}
            className="border border-zinc-400 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-kenya-green dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">Add a market…</option>
            {unfollowedCountries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!countryToAdd}
            onClick={() => {
              const countryId = Number(countryToAdd);
              setCountryToAdd("");
              toggle(`country-${countryId}`, { countryId });
            }}
            className="rounded-full bg-kenya-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-kenya-green/90 disabled:opacity-50"
          >
            Follow
          </button>
        </div>

        {followedCountries.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {followedCountries.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={pending === `country-${c.id}`}
                onClick={() => toggle(`country-${c.id}`, { countryId: c.id })}
                className="flex items-center gap-1.5 rounded-full border border-kenya-green bg-kenya-green px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                {c.name}
                <span aria-hidden>×</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
