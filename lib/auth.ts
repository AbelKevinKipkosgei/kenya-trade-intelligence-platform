import NextAuth, { type DefaultSession } from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Facebook from "next-auth/providers/facebook";
import LinkedIn from "next-auth/providers/linkedin";
import { compare } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, accounts, type UserRole } from "@/db/schema";
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
 * Maps our `users` row to Auth.js's AdapterUser shape. Two fields need
 * translating, not just renaming:
 * - `id` must be a string (Auth.js is storage-agnostic; ours is a serial
 *   integer).
 * - `emailVerified` must be a `Date | null` (the date first verified) —
 *   ours is a plain boolean, so it's mapped to "now" or null. Session-level
 *   consumers (lib/auth.ts's own session() callback below) already treat
 *   this as a boolean via a cast for the same reason.
 */
function toAdapterUser(user: typeof users.$inferSelect): AdapterUser {
  return {
    id: user.id.toString(),
    name: user.fullName,
    email: user.email,
    image: user.image,
    emailVerified: user.emailVerified ? new Date() : null,
    // Not part of Auth.js's own AdapterUser shape, but required on ours —
    // our `declare module "next-auth" { interface User { role... } }"
    // augmentation makes `role` part of `User`, which `AdapterUser`
    // extends. Omitting it here would silently default every returning
    // OAuth user's session to role "public" in the jwt() callback below,
    // regardless of what's actually stored for them.
    role: user.role,
  } as AdapterUser;
}

/**
 * Hand-written adapter, not @auth/drizzle-adapter's generic implementation.
 * That adapter's default tables assume a UUID-string-keyed `user` table
 * (see its `pg.js`), which doesn't match this app's pre-existing
 * serial-integer `users` table (also missing a `name` column — we have
 * `fullName` — and using a boolean `emailVerified` instead of Auth.js's
 * `Date | null`). Passing our tables via DrizzleAdapter's second argument
 * doesn't fix this: the mismatch is in field names/types, not table
 * identity, so every method that touches `users` needs the translation in
 * `toAdapterUser` above applied by hand. `getUserByAccount`/`linkAccount`/
 * `unlinkAccount` only touch the new `accounts` table (see db/schema/
 * users.ts), which was designed to fit this adapter's needs directly.
 *
 * Only the methods Auth.js actually calls under this config (JWT sessions,
 * no Email/passkey provider — see @auth/core's handleLoginOrRegister) are
 * implemented: getUser, getUserByEmail, getUserByAccount, createUser,
 * updateUser, linkAccount, unlinkAccount. createSession/getSessionAndUser/
 * deleteSession/createVerificationToken/useVerificationToken are never
 * invoked under this config, so they're deliberately omitted rather than
 * built against tables nothing would ever populate.
 */
const authAdapter: Adapter = {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, Number(id))).limit(1);
    return user ? toAdapterUser(user) : null;
  },

  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user ? toAdapterUser(user) : null;
  },

  async getUserByAccount({ provider, providerAccountId }) {
    const [row] = await db
      .select({ user: users })
      .from(accounts)
      .innerJoin(users, eq(users.id, accounts.userId))
      .where(and(eq(accounts.provider, provider), eq(accounts.providerAccountId, providerAccountId)))
      .limit(1);
    return row ? toAdapterUser(row.user) : null;
  },

  async createUser(data) {
    // OAuth-only account: no passwordHash (nullable — see db/schema/
    // users.ts), so this user simply can't use the credentials sign-in
    // form unless they later set a password via account settings.
    const [user] = await db
      .insert(users)
      .values({
        email: data.email,
        fullName: data.name || data.email.split("@")[0],
        image: data.image ?? null,
        emailVerified: !!data.emailVerified,
      })
      .returning();
    return toAdapterUser(user);
  },

  async updateUser(data) {
    const [user] = await db
      .update(users)
      .set({
        ...(data.name !== undefined && { fullName: data.name ?? undefined }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.emailVerified !== undefined && { emailVerified: !!data.emailVerified }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, Number(data.id)))
      .returning();
    return toAdapterUser(user);
  },

  async linkAccount(account) {
    await db.insert(accounts).values({
      userId: Number(account.userId),
      type: account.type,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      refreshToken: account.refresh_token ?? null,
      accessToken: account.access_token ?? null,
      expiresAt: account.expires_at ?? null,
      tokenType: account.token_type ?? null,
      scope: account.scope ?? null,
      idToken: account.id_token ?? null,
      sessionState: typeof account.session_state === "string" ? account.session_state : null,
    });
  },

  async unlinkAccount({ provider, providerAccountId }) {
    await db
      .delete(accounts)
      .where(and(eq(accounts.provider, provider), eq(accounts.providerAccountId, providerAccountId)));
  },
};

/**
 * NextAuth.js configuration for self-hosted authentication.
 * Uses JWT sessions (stateless) for scalability and Postgres for user storage.
 * Government email domain validation enforced at signup, not here.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: authAdapter,

  // Use JWT sessions (stateless) instead of database sessions
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  providers: [
    // Client ID/secret come from env vars Auth.js infers automatically from
    // each provider's id (AUTH_GOOGLE_ID/SECRET, AUTH_GITHUB_ID/SECRET,
    // AUTH_FACEBOOK_ID/SECRET, AUTH_LINKEDIN_ID/SECRET) — see
    // next-auth's setEnvDefaults. Register an OAuth app with each provider
    // and add those to .env.local; a provider with no credentials set just
    // won't be usable, it won't break the others.
    //
    // allowDangerousEmailAccountLinking: true auto-attaches a first-time
    // OAuth sign-in to an existing password-based account with the same
    // email, rather than showing an "OAuthAccountNotLinked" error — chosen
    // deliberately (the alternative is more secure but more friction for a
    // legitimate user who forgot they'd signed up with a password). This is
    // safe here because all four providers only ever hand back an email
    // they themselves have already verified.
    Google({ allowDangerousEmailAccountLinking: true }),
    LinkedIn({ allowDangerousEmailAccountLinking: true }),
    GitHub({ allowDangerousEmailAccountLinking: true }),
    Facebook({ allowDangerousEmailAccountLinking: true }),
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

        // No password on file — this account was created via an OAuth
        // provider (Google, LinkedIn, GitHub, Facebook) and has never set
        // one, so credentials sign-in isn't possible for it.
        if (!user.passwordHash) {
          return null;
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
        };
      },
    }),
  ],

  callbacks: {
    // Extra defense on top of allowDangerousEmailAccountLinking: reject an
    // OAuth sign-in outright if the provider explicitly reports the email
    // as unverified. Only Google's raw profile actually exposes
    // `email_verified` (documented in next-auth/providers/google); GitHub,
    // Facebook, and LinkedIn's mapped profiles don't surface it at all, and
    // `undefined !== false` here, so this only ever blocks the case a
    // provider actively flags as unverified — it never blocks a provider
    // that's silent on the question.
    async signIn({ account, profile }) {
      if (account?.type === "oauth" || account?.type === "oidc") {
        if (profile?.email_verified === false) {
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // On sign in, add custom fields to JWT
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
      }
      // The client calling useSession().update({ role }) fires this with
      // trigger "update" instead of a fresh `user` — needed because a JWT
      // session never re-reads the database on its own, so a role change
      // made mid-session (e.g. picking an account type during onboarding —
      // see app/onboarding, components/onboarding/account-type-step.tsx)
      // would otherwise stay invisible until the next full sign-in.
      if (trigger === "update" && session && typeof session === "object" && "role" in session) {
        token.role = (session as { role: UserRole }).role;
      }
      return token;
    },

    async session({ session, token }) {
      // Add custom fields to session from JWT.
      //
      // Two casts are unavoidable here, not shortcuts around a type we could
      // otherwise satisfy cleanly:
      // - `token`'s custom fields (id/role/emailVerified) come back as
      //   `unknown`, since JWT's real shape (from @auth/core) is
      //   `Record<string, unknown> & DefaultJWT` — augmenting next-auth/jwt
      //   to narrow them doesn't work: that module's .d.ts is a bare
      //   `export * from "@auth/core/jwt"` re-export, and TS's ambient
      //   `declare module` augmentation can't resolve subpath-exports
      //   packages shaped that way (confirmed: a plain `import type` of the
      //   same specifier resolves fine — only the augmentation form fails
      //   with "module cannot be found").
      // - `session.user`'s augmented type (above) declares `emailVerified:
      //   boolean`, but the Auth.js adapter contract's `AdapterUser`
      //   declares `emailVerified: Date | null` — this app stores it as a
      //   boolean instead, so the merged type is unusable for a direct
      //   assignment.
      if (session.user && token) {
        const user = session.user as unknown as {
          id: string;
          role: UserRole;
          emailVerified: boolean;
        };
        user.id = (token.id as string) || "";
        user.role = (token.role as UserRole) || "public";
        user.emailVerified = Boolean(token.emailVerified);
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
 * True if `error` is the specific "Unauthorized" thrown by requireAuth().
 * Route handlers that wrap requireAuth() in a generic try/catch can use
 * this to return 401 instead of letting an auth failure fall through to
 * the same 500 used for genuine server errors.
 */
export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message === "Unauthorized";
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
