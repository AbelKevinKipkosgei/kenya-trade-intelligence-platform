import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/db/client";
import { users, userProfiles, type UserRole } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isValidPassword, PASSWORD_REQUIREMENTS_MESSAGE } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, role } = body;

    // Validate required fields
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: PASSWORD_REQUIREMENTS_MESSAGE },
        { status: 400 }
      );
    }

    // Validate role — officer is deliberately excluded: not self-selectable
    // for now (see the UserRole comment in db/schema/users.ts).
    const validRoles: UserRole[] = ["public", "exporter", "importer", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Prevent self-service admin account creation
    if (role === "admin") {
      return NextResponse.json(
        { error: "Admin accounts cannot be self-registered" },
        { status: 403 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        fullName: fullName.trim(),
        passwordHash,
        role: role as UserRole,
        emailVerified: false,
        isActive: true,
      })
      .returning();

    // Create user profile
    await db.insert(userProfiles).values({
      userId: newUser.id,
      notificationPreferences: {
        email: true,
        inApp: true,
        emailFrequency: "daily",
      },
    });

    // Return success (no sensitive data)
    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
