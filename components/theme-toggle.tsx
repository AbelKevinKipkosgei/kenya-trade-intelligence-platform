"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const OPTIONS = ["system", "light", "dark"] as const;

function noopSubscribe() {
  return () => {};
}

/** True once mounted on the client; false during SSR and the first client render. */
function useIsMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // Avoid a hydration mismatch: the resolved theme is only known client-side.
  const mounted = useIsMounted();

  const current = mounted ? (theme ?? "system") : "system";

  return (
    <div className="flex items-center rounded-full border border-stone-400 p-0.5 text-xs font-medium dark:border-zinc-600">
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setTheme(option)}
          aria-pressed={current === option}
          className={`rounded-full px-2.5 py-1 capitalize transition-colors ${
            current === option
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
