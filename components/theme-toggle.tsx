"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const OPTIONS = [
  {
    value: "system",
    label: "System",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 19.128v-1.007M9 17.25h6M9 17.25H4.5a2.25 2.25 0 01-2.25-2.25V5.25A2.25 2.25 0 014.5 3h15a2.25 2.25 0 012.25 2.25v9.75a2.25 2.25 0 01-2.25 2.25H15"
      />
    ),
  },
  {
    value: "light",
    label: "Light",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
      />
    ),
  },
] as const;

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
    <div className="flex items-center rounded-full border border-stone-400 p-0.5 dark:border-zinc-600">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setTheme(option.value)}
          aria-pressed={current === option.value}
          aria-label={`${option.label} theme`}
          title={`${option.label} theme`}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            current === option.value
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {option.icon}
          </svg>
        </button>
      ))}
    </div>
  );
}
