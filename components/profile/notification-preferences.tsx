"use client";

import { useState, useEffect } from "react";

interface Profile {
  id: number;
  userId: number;
  notificationPreferences?: {
    inApp?: boolean;
    email?: boolean;
    emailFrequency?: "immediate" | "daily" | "weekly";
    categories?: {
      tariffChanges?: boolean;
      barriers?: boolean;
      opportunities?: boolean;
      newProducts?: boolean;
    };
  };
}

interface NotificationPreferencesProps {
  userId: number;
  profile: Profile | null;
}

export function NotificationPreferences({
  userId,
  profile,
}: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState({
    inApp: profile?.notificationPreferences?.inApp ?? true,
    email: profile?.notificationPreferences?.email ?? false,
    emailFrequency:
      profile?.notificationPreferences?.emailFrequency ?? "daily",
    categories: {
      tariffChanges:
        profile?.notificationPreferences?.categories?.tariffChanges ?? true,
      barriers: profile?.notificationPreferences?.categories?.barriers ?? true,
      opportunities:
        profile?.notificationPreferences?.categories?.opportunities ?? true,
      newProducts:
        profile?.notificationPreferences?.categories?.newProducts ?? true,
    },
  });

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");

    try {
      const response = await fetch("/api/profile/notification-preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Error saving preferences:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 5000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t-4 border-kenya-red bg-white p-8 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
            Notification Preferences
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Control how and when you receive updates about your watchlist items
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {/* Notification Channels */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Notification Channels
          </h3>
          <div className="mt-4 space-y-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={preferences.inApp}
                onChange={(e) =>
                  setPreferences({ ...preferences, inApp: e.target.checked })
                }
                className="mt-0.5 h-4 w-4 cursor-pointer border-zinc-300 text-kenya-green focus:ring-kenya-green dark:border-zinc-600"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-zinc-950 dark:text-white">
                  In-app notifications
                </span>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Show notifications in the notification bell and center
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={preferences.email}
                onChange={(e) =>
                  setPreferences({ ...preferences, email: e.target.checked })
                }
                className="mt-0.5 h-4 w-4 cursor-pointer border-zinc-300 text-kenya-green focus:ring-kenya-green dark:border-zinc-600"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-zinc-950 dark:text-white">
                  Email notifications
                </span>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Receive notifications via email
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Email Frequency */}
        {preferences.email && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Email Frequency
            </h3>
            <div className="mt-4 space-y-2">
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="emailFrequency"
                  value="immediate"
                  checked={preferences.emailFrequency === "immediate"}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      emailFrequency: e.target.value as any,
                    })
                  }
                  className="h-4 w-4 cursor-pointer border-zinc-300 text-kenya-green focus:ring-kenya-green dark:border-zinc-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-zinc-950 dark:text-white">
                    Immediate
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Send an email for each notification as it happens
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="emailFrequency"
                  value="daily"
                  checked={preferences.emailFrequency === "daily"}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      emailFrequency: e.target.value as any,
                    })
                  }
                  className="h-4 w-4 cursor-pointer border-zinc-300 text-kenya-green focus:ring-kenya-green dark:border-zinc-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-zinc-950 dark:text-white">
                    Daily digest
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Receive a single email per day with all updates
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="emailFrequency"
                  value="weekly"
                  checked={preferences.emailFrequency === "weekly"}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      emailFrequency: e.target.value as any,
                    })
                  }
                  className="h-4 w-4 cursor-pointer border-zinc-300 text-kenya-green focus:ring-kenya-green dark:border-zinc-600"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-zinc-950 dark:text-white">
                    Weekly digest
                  </span>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Receive a single email per week with all updates
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Notification Categories */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Notification Types
          </h3>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Choose which types of updates you want to receive
          </p>
          <div className="mt-4 space-y-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={preferences.categories.tariffChanges}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    categories: {
                      ...preferences.categories,
                      tariffChanges: e.target.checked,
                    },
                  })
                }
                className="mt-0.5 h-4 w-4 cursor-pointer border-zinc-300 text-kenya-green focus:ring-kenya-green dark:border-zinc-600"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-zinc-950 dark:text-white">
                  📊 Tariff changes
                </span>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Changes to tariff rates on your tracked products
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={preferences.categories.barriers}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    categories: {
                      ...preferences.categories,
                      barriers: e.target.checked,
                    },
                  })
                }
                className="mt-0.5 h-4 w-4 cursor-pointer border-zinc-300 text-kenya-green focus:ring-kenya-green dark:border-zinc-600"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-zinc-950 dark:text-white">
                  ⚠️ Trade barriers
                </span>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  New barriers or resolved barriers affecting your markets
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={preferences.categories.opportunities}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    categories: {
                      ...preferences.categories,
                      opportunities: e.target.checked,
                    },
                  })
                }
                className="mt-0.5 h-4 w-4 cursor-pointer border-zinc-300 text-kenya-green focus:ring-kenya-green dark:border-zinc-600"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-zinc-950 dark:text-white">
                  📈 Opportunity updates
                </span>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Score changes and new opportunities in tracked sectors
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={preferences.categories.newProducts}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    categories: {
                      ...preferences.categories,
                      newProducts: e.target.checked,
                    },
                  })
                }
                className="mt-0.5 h-4 w-4 cursor-pointer border-zinc-300 text-kenya-green focus:ring-kenya-green dark:border-zinc-600"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-zinc-950 dark:text-white">
                  🎯 Price alerts
                </span>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Price changes and new product listings
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex h-10 items-center gap-2 border border-kenya-green bg-kenya-green px-6 text-sm font-semibold text-white transition-colors hover:bg-[#004d00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save Preferences
              </>
            )}
          </button>

          {saveStatus === "success" && (
            <span className="text-sm font-medium text-kenya-green">
              ✓ Preferences saved successfully
            </span>
          )}

          {saveStatus === "error" && (
            <span className="text-sm font-medium text-kenya-red">
              ✗ Failed to save preferences. Please try again.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
