"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Result = { id: number; hsCode: string; description: string };

export function ProductSearchBox({ autoFocus }: { autoFocus?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      // No fetch for a too-short query; stale results just stay unused —
      // rendering is guarded on query length below, so nothing shows.
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/products/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data: { results: Result[] }) => {
          setResults(data.results);
          setOpen(true);
        })
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(hsCode: string) {
    setOpen(false);
    setQuery("");
    router.push(`/explorer?hs=${encodeURIComponent(hsCode)}`);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        autoFocus={autoFocus}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search by HS code or product name…"
        className="w-full rounded-full border border-stone-400 bg-white px-4 py-2.5 text-base sm:text-sm text-zinc-900 outline-none focus:border-kenya-green dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
      />
      {open && query.trim().length >= 2 && results.length > 0 && (
        <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-stone-300 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => select(r.hsCode)}
              className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left text-sm hover:bg-stone-100 dark:hover:bg-zinc-700"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{r.hsCode}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{r.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
