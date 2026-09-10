import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, type UserRole } from "@/db/schema";
import { authConfig } from "@/auth.config";

/**
 * Extended session type with user role for RBAC.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      emailVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    emailVerified: boolean;
  }
}

/**
 * Extended JWT type with custom fields.
 */
interface JWT {
  id?: string;
  role?: UserRole;
  emailVerified?: boolean;
}

/**
 * NextAuth.js configuration for self-hosted authentication.
 * Uses JWT sessions (stateless) for scalability and Postgres for user storage.
 * Government email domain validation enforced at signup, not here.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),

  // Use JWT sessions (stateless) instead of database sessions
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Find user by email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        if (!user) {
          return null;
        }

        // Check if account is active
        if (!user.isActive) {
          throw new Error("Account is deactivated");
        }

        // Verify password
        const isValidPassword = await compare(password, user.passwordHash);
        if (!isValidPassword) {
          return null;
        }

        // Update last login timestamp
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id));

        // Return user object for JWT
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.fullName,
          role: user.role,
          emailVerified: user.emailVerified,
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // On sign in, add custom fields to JWT
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },

    async session({ session, token }) {
      // Add custom fields to session from JWT
      if (session.user && token) {
        (session.user as any).id = (token.id as string) || "";
        (session.user as any).role = (token.role as UserRole) || "public";
        (session.user as any).emailVerified = Boolean(token.emailVerified);
      }
      return session;
    },
  },

  // Security settings
  secret: process.env.AUTH_SECRET,
  trustHost: true,
});

/**
 * Server-side helper to get the current session.
 * Returns null if not authenticated.
 */
export async function getSession() {
  return await auth();
}

/**
 * Server-side helper to require authentication.
 * Throws if not authenticated.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Server-side helper to require a specific role.
 * Throws if user doesn't have required role.
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }
  return session;
}
