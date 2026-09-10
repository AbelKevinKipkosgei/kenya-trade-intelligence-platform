import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ExporterOnboarding } from "@/components/onboarding/exporter-onboarding";
import { OfficerOnboarding } from "@/components/onboarding/officer-onboarding";

/**
 * Onboarding page for new users.
 * Detects user role and shows appropriate onboarding form.
 * If profile already exists, redirects to dashboard.
 */
export default async function OnboardingPage() {
  // requireAuth() throws on no session, which crashes to a generic 500
  // instead of a sign-in prompt — redirect() is the correct way to gate
  // a page.
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const userId = parseInt(session.user.id);

  // Check if user has already completed onboarding
  const [existingProfile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  // If profile exists and has required data, redirect to dashboard
  if (existingProfile) {
    const role = session.user.role;
    
    // Check if onboarding is complete based on role
    if (role === "exporter" && existingProfile.primarySectorId) {
      redirect("/dashboard");
    }
    
    if (role === "officer" && existingProfile.agencyId) {
      redirect("/dashboard");
    }

    // Public users can skip to dashboard
    if (role === "public") {
      redirect("/dashboard");
    }
  }

  const role = session.user.role;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 inline-block border-l-4 border-kenya-green pl-4">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Welcome to KTIP
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Let&apos;s set up your profile to personalize your experience
            </p>
          </div>
        </div>

        {/* Role-specific onboarding */}
        {role === "exporter" && <ExporterOnboarding userId={userId} />}
        {role === "officer" && <OfficerOnboarding userId={userId} />}
        {role === "public" && (
          <div className="border-t-4 border-kenya-black bg-white p-8 dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
              You&apos;re all set!
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              As a public user, you have access to browse the
              platform&apos;s trade intelligence data.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex h-11 items-center justify-center border border-kenya-green bg-kenya-green px-6 text-sm font-semibold text-white transition-colors hover:bg-[#004d00]"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
