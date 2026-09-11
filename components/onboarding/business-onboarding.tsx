"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Sector {
  id: number;
  name: string;
}

interface County {
  id: number;
  name: string;
  region: string;
}

interface BusinessOnboardingProps {
  role: "exporter" | "importer";
  next: string;
}

const COPY = {
  exporter: {
    sectorLabel: "Primary Sector",
    sectorHelp: "The sector you mainly export in.",
    bioPlaceholder: "Briefly describe your products, markets, and export goals...",
  },
  importer: {
    sectorLabel: "Primary Sector",
    sectorHelp: "The sector you mainly import in.",
    bioPlaceholder: "Briefly describe your products, sourcing markets, and import goals...",
  },
};

/**
 * Business-details onboarding form shared by the exporter and importer
 * roles — the underlying user_profiles columns (businessType,
 * primarySectorId, countiesOfOperation, businessRegistrationNumber, bio)
 * are generic business attributes, not exporter-specific, so one form with
 * role-aware copy covers both instead of two near-identical files.
 */
export function BusinessOnboarding({ role, next }: BusinessOnboardingProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [counties, setCounties] = useState<County[]>([]);

  const [formData, setFormData] = useState({
    businessType: "manufacturer" as "manufacturer" | "trader" | "cooperative" | "sme",
    primarySectorId: "",
    countiesOfOperation: [] as number[],
    businessRegistrationNumber: "",
    bio: "",
  });

  const copy = COPY[role];

  // Fetch reference data
  useEffect(() => {
    Promise.all([
      fetch("/api/reference/sectors").then((r) => r.json()),
      fetch("/api/reference/counties").then((r) => r.json()),
    ]).then(([sectorsData, countiesData]) => {
      setSectors(sectorsData.sectors || []);
      setCounties(countiesData.counties || []);
    });
  }, []);

  const handleCountyToggle = (countyId: number) => {
    setFormData((prev) => ({
      ...prev,
      countiesOfOperation: prev.countiesOfOperation.includes(countyId)
        ? prev.countiesOfOperation.filter((id) => id !== countyId)
        : [...prev.countiesOfOperation, countyId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.primarySectorId) {
      setError("Please select your primary sector");
      return;
    }

    if (formData.countiesOfOperation.length === 0) {
      setError("Please select at least one county of operation");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: formData.businessType,
          primarySectorId: parseInt(formData.primarySectorId),
          countiesOfOperation: formData.countiesOfOperation,
          businessRegistrationNumber: formData.businessRegistrationNumber || null,
          bio: formData.bio || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save profile");
        setLoading(false);
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="border-t-4 border-kenya-black bg-white p-8 dark:bg-zinc-900">
      <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
        Tell us about your business
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        This helps us personalize trade intelligence and opportunities for you.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {error && (
          <div className="border-l-4 border-kenya-red bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Business Type */}
        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Business Type
          </label>
          <select
            value={formData.businessType}
            onChange={(e) =>
              setFormData({
                ...formData,
                businessType: e.target.value as
                  | "manufacturer"
                  | "trader"
                  | "cooperative"
                  | "sme",
              })
            }
            className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="manufacturer">Manufacturer</option>
            <option value="trader">Trader / Distributor</option>
            <option value="cooperative">Cooperative</option>
            <option value="sme">Small & Medium Enterprise (SME)</option>
          </select>
        </div>

        {/* Primary Sector */}
        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {copy.sectorLabel} <span className="text-kenya-red">*</span>
          </label>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{copy.sectorHelp}</p>
          <select
            value={formData.primarySectorId}
            onChange={(e) =>
              setFormData({ ...formData, primarySectorId: e.target.value })
            }
            required
            className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">Select your primary sector...</option>
            {sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.name}
              </option>
            ))}
          </select>
        </div>

        {/* Business Registration Number */}
        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Business Registration Number (Optional)
          </label>
          <input
            type="text"
            value={formData.businessRegistrationNumber}
            onChange={(e) =>
              setFormData({
                ...formData,
                businessRegistrationNumber: e.target.value,
              })
            }
            placeholder="e.g., PVT-ABCD1234"
            className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {/* Counties of Operation */}
        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Counties of Operation <span className="text-kenya-red">*</span>
          </label>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Select all counties where your business operates
          </p>
          <div className="mt-3 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50 sm:grid-cols-3">
            {counties.map((county) => (
              <label
                key={county.id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={formData.countiesOfOperation.includes(county.id)}
                  onChange={() => handleCountyToggle(county.id)}
                  className="h-4 w-4 border-zinc-300 text-kenya-green focus:ring-kenya-green"
                />
                <span className="text-zinc-700 dark:text-zinc-300">
                  {county.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            About Your Business (Optional)
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            placeholder={copy.bioPlaceholder}
            className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 flex-1 items-center justify-center border border-kenya-green bg-kenya-green text-sm font-semibold text-white transition-colors hover:bg-[#004d00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Complete Setup"}
          </button>
          <button
            type="button"
            onClick={() => router.push(next)}
            className="flex h-11 items-center justify-center border border-zinc-400 px-6 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Skip for now
          </button>
        </div>
      </form>
    </div>
  );
}
