"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { UserRole } from "@/db/schema";

const ACCOUNT_TYPES: { role: UserRole; label: string; description: string }[] = [
  {
    role: "exporter",
    label: "Exporter",
    description: "I run a business that exports (or wants to export) goods from Kenya.",
  },
  {
    role: "importer",
    label: "Importer",
    description: "I run a business that imports goods into Kenya.",
  },
  {
    role: "public",
    label: "Public / Researcher",
    description: "I just want to browse trade data — no business profile needed.",
  },
];

interface AccountTypeStepProps {
  // Where to land once this account turns out to need no further steps
  // (the "public" choice) — preserved from wherever the sign-in/sign-up
  // flow originally intended to send this user, e.g. a protected page they
  // were redirected away from before authenticating.
  next: string;
}

/**
 * Shown only when a signed-in user has no user_profiles row at all — in
 * practice, a first-time OAuth sign-in (Google/LinkedIn/GitHub/Facebook),
 * since credentials signup already asks for an account type up front and
 * creates this row immediately (see app/api/auth/signup/route.ts). OAuth's
 * createUser (lib/auth.ts) has no form to ask at, so it defaults to "public"
 * and skips the profile row — this step is where that choice actually gets
 * made, after the fact.
 */
export function AccountTypeStep({ next }: AccountTypeStepProps) {
  const router = useRouter();
  const { update } = useSession();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    if (!selected) return;
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selected }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save account type");
        setLoading(false);
        return;
      }

      // The JWT session caches role at sign-in time (see lib/auth.ts's jwt
      // callback) and never re-reads the database on its own — update()
      // refreshes it immediately so the next check (in app/onboarding/
      // page.tsx, re-run by router.refresh() below) sees the new role
      // instead of the stale "public" default.
      await update({ role: selected });

      if (selected === "public") {
        router.push(next);
      } else {
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="border-t-4 border-kenya-black bg-white p-8 dark:bg-zinc-900">
      <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
        What best describes you?
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        This helps us personalize trade intelligence and opportunities for you.
      </p>

      {error && (
        <div className="mt-4 border-l-4 border-kenya-red bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {ACCOUNT_TYPES.map((type) => (
          <button
            key={type.role}
            type="button"
            onClick={() => setSelected(type.role)}
            className={`block w-full border p-4 text-left transition-colors ${
              selected === type.role
                ? "border-kenya-green bg-kenya-green/5 dark:bg-kenya-green/10"
                : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
            }`}
          >
            <span className="block text-sm font-semibold text-zinc-950 dark:text-white">
              {type.label}
            </span>
            <span className="mt-1 block text-sm text-zinc-600 dark:text-zinc-400">
              {type.description}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected || loading}
          className="flex h-11 w-full items-center justify-center border border-kenya-green bg-kenya-green text-sm font-semibold text-white transition-colors hover:bg-[#004d00] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
