import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAuth, isUnauthorizedError } from "@/lib/auth";
import { db } from "@/db/client";
import { users, userProfiles, type UserRole } from "@/db/schema";

// Self-selectable account types only — officer/admin are provisioned another
// way (see the UserRole comment in db/schema/users.ts), same restriction the
// credentials signup route enforces.
const SELECTABLE_ROLES: UserRole[] = ["public", "exporter", "importer"];

/**
 * POST /api/user/role
 * Sets the current user's account type. Only meant to be called once, from
 * the onboarding "choose your account type" step — the only case where a
 * user reaches onboarding with no role of their own yet is a first-time
 * OAuth sign-in, since createUser (lib/auth.ts) has no signup form to ask at
 * account-creation time, unlike the credentials flow. Also provisions the
 * same empty user_profiles row the credentials signup route creates
 * immediately, so this account reaches the exact same "has a profile row,
 * still needs role-specific details" state a credentials signup starts in.
 */
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const userId = parseInt(session.user.id);

    const body = await request.json().catch(() => null);
    const role = body?.role as UserRole | undefined;

    if (!role || !SELECTABLE_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));

    const [existingProfile] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (!existingProfile) {
      await db.insert(userProfiles).values({
        userId,
        notificationPreferences: {
          email: true,
          inApp: true,
          emailFrequency: "daily",
        },
      });
    }

    return NextResponse.json({ success: true, role });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Set account type error:", error);
    return NextResponse.json({ error: "Failed to set account type" }, { status: 500 });
  }
}
