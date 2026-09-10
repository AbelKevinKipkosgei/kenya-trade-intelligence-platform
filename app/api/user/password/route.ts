import { NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { auth, isUnauthorizedError, requireAuth } from "@/lib/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { isValidPassword, PASSWORD_REQUIREMENTS_MESSAGE } from "@/lib/validation";

/**
 * POST /api/user/password
 * Sets a password for the current user (OAuth-only accounts have none —
 * see lib/auth.ts) or changes an existing one. A user with an existing
 * password must supply and verify it first; a user with none (signed up
 * via Google/LinkedIn/GitHub/Facebook) is setting one for the first time
 * and has nothing to verify against — the session itself is the proof of
 * identity there, same as it is for every other authenticated action.
 */
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const userId = parseInt(session.user.id);

    const body = await request.json().catch(() => null);
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : undefined;
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : undefined;

    if (!newPassword) {
      return NextResponse.json({ error: "New password is required" }, { status: 400 });
    }

    if (!isValidPassword(newPassword)) {
      return NextResponse.json({ error: PASSWORD_REQUIREMENTS_MESSAGE }, { status: 400 });
    }

    const [user] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }
      const isValid = await compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
    }

    const newPasswordHash = await hash(newPassword, 12);
    await db.update(users).set({ passwordHash: newPasswordHash, updatedAt: new Date() }).where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: user.passwordHash ? "Password changed successfully" : "Password set successfully",
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Set/change password error:", error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}

/**
 * GET /api/user/password
 * Whether the current user has a password set at all — the account
 * security UI needs this to show "Set a password" vs. "Change password"
 * without ever receiving the hash itself.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.user.id);

    const [user] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return NextResponse.json({ hasPassword: !!user?.passwordHash });
  } catch (error) {
    console.error("Check password status error:", error);
    return NextResponse.json({ error: "Failed to check password status" }, { status: 500 });
  }
}
