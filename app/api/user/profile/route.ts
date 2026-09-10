import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db/client";
import { userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/user/profile
 * Fetch the current user's profile.
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = parseInt(session.user.id);

    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/profile
 * Create or update the current user's profile.
 */
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const userId = parseInt(session.user.id);
    const body = await request.json();

    // Check if profile exists
    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    const profileData = {
      userId,
      ...body,
      updatedAt: new Date(),
    };

    let profile;
    if (existingProfile) {
      // Update existing profile
      [profile] = await db
        .update(userProfiles)
        .set(profileData)
        .where(eq(userProfiles.userId, userId))
        .returning();
    } else {
      // Create new profile
      [profile] = await db.insert(userProfiles).values(profileData).returning();
    }

    return NextResponse.json({ profile, success: true });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * Partially update the current user's profile.
 */
export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const userId = parseInt(session.user.id);
    const body = await request.json();

    // Validate that profile exists
    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (!existingProfile) {
      return NextResponse.json(
        { error: "Profile not found. Create profile first." },
        { status: 404 }
      );
    }

    // Update only provided fields
    const [profile] = await db
      .update(userProfiles)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId))
      .returning();

    return NextResponse.json({ profile, success: true });
  } catch (error) {
    console.error("Patch profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
