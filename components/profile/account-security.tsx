"use client";

import { useState } from "react";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  "linkedin": "LinkedIn",
  github: "GitHub",
  facebook: "Facebook",
};

interface AccountSecurityProps {
  hasPassword: boolean;
  linkedProviders: string[];
}

export function AccountSecurity({ hasPassword: initialHasPassword, linkedProviders: initialProviders }: AccountSecurityProps) {
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [providers, setProviders] = useState(initialProviders);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);
  const [unlinkError, setUnlinkError] = useState("");

  const canUnlinkAnotherProvider = hasPassword || providers.length > 1;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(hasPassword && { currentPassword }),
          newPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || "Failed to update password");
        return;
      }

      setHasPassword(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(data.message || "Password updated");
    } catch {
      setPasswordError("An unexpected error occurred");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleUnlink = async (provider: string) => {
    setUnlinkError("");
    if (!confirm(`Disconnect ${PROVIDER_LABELS[provider] ?? provider}? You'll no longer be able to sign in with it.`)) {
      return;
    }

    setUnlinkingProvider(provider);
    try {
      const response = await fetch(`/api/user/accounts?provider=${encodeURIComponent(provider)}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setUnlinkError(data.error || "Failed to disconnect provider");
        return;
      }

      setProviders((prev) => prev.filter((p) => p !== provider));
    } catch {
      setUnlinkError("An unexpected error occurred");
    } finally {
      setUnlinkingProvider(null);
    }
  };

  return (
    <div className="border-t-4 border-zinc-300 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
        Account Security
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Manage your password and connected sign-in methods
      </p>

      {/* Password */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {hasPassword ? "Change Password" : "Set a Password"}
        </h3>
        {!hasPassword && (
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            You signed up with an external provider and don&apos;t have a password yet. Set one to also be able to sign in with your email.
          </p>
        )}

        <form onSubmit={handlePasswordSubmit} className="mt-4 max-w-md space-y-4">
          {passwordError && (
            <div className="border-l-4 border-kenya-red bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="border-l-4 border-kenya-green bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-200">
              {passwordSuccess}
            </div>
          )}

          {hasPassword && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Current Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              New Password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters, upper+lowercase, and a number"
              className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <button
            type="submit"
            disabled={passwordSaving}
            className="flex h-10 items-center justify-center border border-kenya-green bg-kenya-green px-6 text-sm font-semibold text-white transition-colors hover:bg-[#004d00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {passwordSaving ? "Saving..." : hasPassword ? "Change Password" : "Set Password"}
          </button>
        </form>
      </div>

      {/* Connected accounts */}
      <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Connected Sign-In Methods
        </h3>

        {unlinkError && (
          <div className="mt-3 border-l-4 border-kenya-red bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
            {unlinkError}
          </div>
        )}

        {providers.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            No external providers connected — you sign in with your email and password.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {providers.map((provider) => (
              <div
                key={provider}
                className="flex items-center justify-between border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {PROVIDER_LABELS[provider] ?? provider}
                </span>
                <button
                  type="button"
                  onClick={() => handleUnlink(provider)}
                  disabled={unlinkingProvider === provider || !canUnlinkAnotherProvider}
                  title={
                    !canUnlinkAnotherProvider
                      ? "Set a password first, or connect another provider, before disconnecting this one"
                      : undefined
                  }
                  className="text-sm font-medium text-kenya-red hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {unlinkingProvider === provider ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
