import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AccountTypeStep } from "@/components/onboarding/account-type-step";
import { BusinessOnboarding } from "@/components/onboarding/business-onboarding";
import { OfficerOnboarding } from "@/components/onboarding/officer-onboarding";

/**
 * Onboarding page for new users.
 * Detects user role and shows appropriate onboarding form.
 * If profile already exists, redirects to dashboard.
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // requireAuth() throws on no session, which crashes to a generic 500
  // instead of a sign-in prompt — redirect() is the correct way to gate
  // a page.
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const userId = parseInt(session.user.id);
  const { next } = await searchParams;
  // Only ever an internal path — never redirect to an attacker-supplied
  // absolute/protocol-relative URL from this query param.
  const nextUrl = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  // Check if user has already completed onboarding
  const [existingProfile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  // No profile row at all means this account has never chosen an account
  // type — in practice, a first-time OAuth sign-in (Google/LinkedIn/GitHub/
  // Facebook). Credentials signup asks for a role up front and always
  // creates an (initially empty) profile row immediately (see
  // app/api/auth/signup/route.ts), so it never lands here.
  if (!existingProfile) {
    return (
      <OnboardingShell>
        <AccountTypeStep next={nextUrl} />
      </OnboardingShell>
    );
  }

  const role = session.user.role;

  // If profile exists and has required data, redirect onward
  if ((role === "exporter" || role === "importer") && existingProfile.primarySectorId) {
    redirect(nextUrl);
  }

  if (role === "officer" && existingProfile.agencyId) {
    redirect(nextUrl);
  }

  // Public users can skip straight through
  if (role === "public") {
    redirect(nextUrl);
  }

  return (
    <OnboardingShell>
      {(role === "exporter" || role === "importer") && (
        <BusinessOnboarding role={role} next={nextUrl} />
      )}
      {role === "officer" && <OfficerOnboarding userId={userId} />}
    </OnboardingShell>
  );
}

function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12">
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
        {children}
      </main>
    </div>
  );
}
