import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/db/client";
import { users, userProfiles, type UserRole } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Government email domains that are allowed for officer accounts.
 * Officers must use one of these domains or require manual admin approval.
 */
const GOVERNMENT_EMAIL_DOMAINS = [
  "trade.go.ke",
  "treasury.go.ke",
  "industrialization.go.ke",
  "agriculture.go.ke",
  "kra.go.ke",
  "kephis.org",
  "epza.go.ke",
];

/**
 * Validate if an email belongs to a government domain.
 */
function isGovernmentEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return GOVERNMENT_EMAIL_DOMAINS.some((govDomain) => domain === govDomain);
}

/**
 * Validate password strength.
 * Must be at least 8 characters with uppercase, lowercase, and number.
 */
function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

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
        {
          error:
            "Password must be at least 8 characters and contain uppercase, lowercase, and number",
        },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles: UserRole[] = ["public", "exporter", "officer", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // For officer role, validate government email domain
    if (role === "officer" && !isGovernmentEmail(email)) {
      return NextResponse.json(
        {
          error:
            "Officer accounts require a government email address (@trade.go.ke, @treasury.go.ke, etc.)",
        },
        { status: 403 }
      );
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
        frequency: "daily",
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
