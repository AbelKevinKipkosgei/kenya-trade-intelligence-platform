import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * PATCH /api/profile/notification-preferences
 * Update user notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { preferences } = await request.json();

    // Validate preferences structure
    if (!preferences || typeof preferences !== "object") {
      return NextResponse.json(
        { error: "Invalid preferences format" },
        { status: 400 }
      );
    }

    // Check if user profile exists
    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (existingProfile) {
      // Update existing profile
      await db
        .update(userProfiles)
        .set({
          notificationPreferences: preferences,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId));
    } else {
      // Create new profile with preferences
      await db.insert(userProfiles).values({
        userId,
        notificationPreferences: preferences,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Notification preferences updated successfully",
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
