"use client";

import { useState, useEffect } from "react";
import type { UserRole } from "@/db/schema";

interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
}

interface Profile {
  id: number;
  businessType: string | null;
  businessRegistrationNumber: string | null;
  primarySectorId: number | null;
  countiesOfOperation: unknown;
  agencyId: number | null;
  department: string | null;
  officerLevel: string | null;
  bio: string | null;
}

interface Sector {
  id: number;
  name: string;
}

interface Agency {
  id: number;
  name: string;
}

interface County {
  id: number;
  name: string;
}

interface ProfileEditFormProps {
  user: User;
  profile: Profile | null;
  // Not read here — this form re-fetches its own reference lists (sectors,
  // agencies, counties) below rather than using the profile's current
  // values, which the caller fetches for a read-only profile view.
  sector: Sector | null;
  agency: Agency | null;
  counties: County[];
  onCancel: () => void;
  onSave: () => void;
}

export function ProfileEditForm({
  user,
  profile,
  onCancel,
  onSave,
}: ProfileEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [counties, setCounties] = useState<County[]>([]);

  const [formData, setFormData] = useState({
    // Exporter fields
    businessType: profile?.businessType || "manufacturer",
    businessRegistrationNumber: profile?.businessRegistrationNumber || "",
    primarySectorId: profile?.primarySectorId?.toString() || "",
    countiesOfOperation: (profile?.countiesOfOperation as number[]) || [],
    // Officer fields
    agencyId: profile?.agencyId?.toString() || "",
    department: profile?.department || "",
    officerLevel: profile?.officerLevel || "national",
    // Common
    bio: profile?.bio || "",
  });

  // Fetch reference data
  useEffect(() => {
    if (user.role === "exporter" || user.role === "importer") {
      Promise.all([
        fetch("/api/reference/sectors").then((r) => r.json()),
        fetch("/api/reference/counties").then((r) => r.json()),
      ]).then(([sectorsData, countiesData]) => {
        setSectors(sectorsData.sectors || []);
        setCounties(countiesData.counties || []);
      });
    } else if (user.role === "officer") {
      fetch("/api/reference/agencies")
        .then((r) => r.json())
        .then((data) => setAgencies(data.agencies || []));
    }
  }, [user.role]);

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
    setLoading(true);

    try {
      const payload: Record<string, unknown> = { bio: formData.bio || null };

      if (user.role === "exporter" || user.role === "importer") {
        payload.businessType = formData.businessType;
        payload.businessRegistrationNumber =
          formData.businessRegistrationNumber || null;
        payload.primarySectorId = formData.primarySectorId
          ? parseInt(formData.primarySectorId)
          : null;
        payload.countiesOfOperation = formData.countiesOfOperation;
      } else if (user.role === "officer") {
        payload.agencyId = formData.agencyId
          ? parseInt(formData.agencyId)
          : null;
        payload.department = formData.department || null;
        payload.officerLevel = formData.officerLevel;
      }

      const method = profile ? "PATCH" : "POST";
      const response = await fetch("/api/user/profile", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update profile");
        setLoading(false);
        return;
      }

      onSave();
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="border-t-4 border-kenya-black bg-white p-8 dark:bg-zinc-900">
      <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
        Edit Profile
      </h2>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {error && (
          <div className="border-l-4 border-kenya-red bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Exporter/importer fields (shared business-profile columns) */}
        {(user.role === "exporter" || user.role === "importer") && (
          <>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Business Type
              </label>
              <select
                value={formData.businessType}
                onChange={(e) =>
                  setFormData({ ...formData, businessType: e.target.value })
                }
                className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="manufacturer">Manufacturer</option>
                <option value="trader">Trader / Distributor</option>
                <option value="cooperative">Cooperative</option>
                <option value="sme">Small & Medium Enterprise (SME)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Primary Sector
              </label>
              <select
                value={formData.primarySectorId}
                onChange={(e) =>
                  setFormData({ ...formData, primarySectorId: e.target.value })
                }
                className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">Select sector...</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Business Registration Number
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
                className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Counties of Operation
              </label>
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
          </>
        )}

        {/* Officer fields */}
        {user.role === "officer" && (
          <>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Agency
              </label>
              <select
                value={formData.agencyId}
                onChange={(e) =>
                  setFormData({ ...formData, agencyId: e.target.value })
                }
                className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">Select agency...</option>
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Operational Level
              </label>
              <select
                value={formData.officerLevel}
                onChange={(e) =>
                  setFormData({ ...formData, officerLevel: e.target.value })
                }
                className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="national">National Level</option>
                <option value="regional">Regional Level</option>
                <option value="county">County Level</option>
              </select>
            </div>
          </>
        )}

        {/* Bio - common field */}
        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {user.role === "officer" ? "Role Description" : "About Your Business"}
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 flex-1 items-center justify-center border border-kenya-green bg-kenya-green text-sm font-semibold text-white transition-colors hover:bg-[#004d00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex h-11 items-center justify-center border border-zinc-400 px-6 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
