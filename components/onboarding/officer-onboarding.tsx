"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Agency {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

interface OfficerOnboardingProps {
  // Unused here — /api/user/profile derives the user from the session
  // server-side, not from the request body.
  userId: number;
}

export function OfficerOnboarding({}: OfficerOnboardingProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agencies, setAgencies] = useState<Agency[]>([]);

  const [formData, setFormData] = useState({
    agencyId: "",
    department: "",
    officerLevel: "national" as "county" | "national" | "regional",
    bio: "",
  });

  // Fetch agencies
  useEffect(() => {
    fetch("/api/reference/agencies")
      .then((r) => r.json())
      .then((data) => {
        setAgencies(data.agencies || []);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.agencyId) {
      setError("Please select your agency");
      return;
    }

    if (!formData.department.trim()) {
      setError("Please enter your department");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId: parseInt(formData.agencyId),
          department: formData.department.trim(),
          officerLevel: formData.officerLevel,
          bio: formData.bio || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save profile");
        setLoading(false);
        return;
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="border-t-4 border-kenya-black bg-white p-8 dark:bg-zinc-900">
      <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
        Government Officer Details
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        This helps us configure your dashboard and access permissions.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {error && (
          <div className="border-l-4 border-kenya-red bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Agency */}
        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Agency / Organization <span className="text-kenya-red">*</span>
          </label>
          <select
            value={formData.agencyId}
            onChange={(e) =>
              setFormData({ ...formData, agencyId: e.target.value })
            }
            required
            className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">Select your agency...</option>
            {agencies.map((agency) => (
              <option key={agency.id} value={agency.id}>
                {agency.name} ({agency.code})
              </option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Department / Division <span className="text-kenya-red">*</span>
          </label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) =>
              setFormData({ ...formData, department: e.target.value })
            }
            required
            placeholder="e.g., Export Promotion, Trade Policy, Market Access"
            className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        {/* Officer Level */}
        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Operational Level
          </label>
          <select
            value={formData.officerLevel}
            onChange={(e) =>
              setFormData({
                ...formData,
                officerLevel: e.target.value as
                  | "county"
                  | "national"
                  | "regional",
              })
            }
            className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="national">National Level</option>
            <option value="regional">Regional Level</option>
            <option value="county">County Level</option>
          </select>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            This determines your dashboard view and data access scope
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Role Description (Optional)
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            placeholder="Briefly describe your role, responsibilities, and areas of focus..."
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
            onClick={() => router.push("/dashboard")}
            className="flex h-11 items-center justify-center border border-zinc-400 px-6 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Skip for now
          </button>
        </div>
      </form>
    </div>
  );
}
