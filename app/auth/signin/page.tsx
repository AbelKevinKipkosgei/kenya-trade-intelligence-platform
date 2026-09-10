"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const registered = searchParams.get("registered") === "true";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        // Redirect to callback URL or home
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-block border-l-4 border-kenya-green pl-3 text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Sign In
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Kenya Trade Intelligence Platform
            </p>
          </div>
        </div>

        {/* Sign in form */}
        <div className="border-t-4 border-kenya-black bg-white p-8 shadow-sm dark:bg-zinc-900">
          {/* Success message after registration */}
          {registered && (
            <div className="mb-5 border-l-4 border-kenya-green bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-200">
              Account created successfully! Please sign in to continue.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error message */}
            {error && (
              <div className="border-l-4 border-kenya-red bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="mt-2 block w-full border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-kenya-green focus:outline-none focus:ring-1 focus:ring-kenya-green dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="••••••••"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center border border-kenya-green bg-kenya-green text-sm font-semibold text-white transition-colors hover:bg-[#004d00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kenya-red disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Sign up link */}
          <div className="mt-6 border-t border-zinc-200 pt-6 text-center dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-semibold text-kenya-green hover:text-[#004d00] dark:hover:text-[#91c98f]"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
          <p>
            Access to trade intelligence requires authentication.
          </p>
          <p className="mt-2">
            This is a government platform with secure data handling.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" />}>
      <SignInForm />
    </Suspense>
  );
}
