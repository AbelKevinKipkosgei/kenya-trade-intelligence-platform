import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth, isUnauthorizedError, requireAuth } from "@/lib/auth";
import { db } from "@/db/client";
import { accounts, users } from "@/db/schema";

/**
 * GET /api/user/accounts
 * Lists the OAuth providers linked to the current user (provider name
 * only — never the stored tokens).
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.user.id);

    const rows = await db
      .select({ provider: accounts.provider })
      .from(accounts)
      .where(eq(accounts.userId, userId));

    return NextResponse.json({ providers: rows.map((r) => r.provider) });
  } catch (error) {
    console.error("List linked accounts error:", error);
    return NextResponse.json({ error: "Failed to list linked accounts" }, { status: 500 });
  }
}

/**
 * DELETE /api/user/accounts?provider=google
 * Unlinks one OAuth provider from the current user. Blocked if this
 * would leave the account with no way to sign back in at all — no
 * password set AND this is the only linked provider.
 */
export async function DELETE(request: Request) {
  try {
    const session = await requireAuth();
    const userId = parseInt(session.user.id);

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");
    if (!provider) {
      return NextResponse.json({ error: "provider is required" }, { status: 400 });
    }

    const [user] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const linkedAccounts = await db
      .select({ provider: accounts.provider })
      .from(accounts)
      .where(eq(accounts.userId, userId));

    const isLastSignInMethod = !user?.passwordHash && linkedAccounts.length <= 1;
    if (isLastSignInMethod) {
      return NextResponse.json(
        { error: "Set a password before disconnecting your only sign-in method" },
        { status: 400 }
      );
    }

    await db.delete(accounts).where(and(eq(accounts.userId, userId), eq(accounts.provider, provider)));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Unlink account error:", error);
    return NextResponse.json({ error: "Failed to unlink account" }, { status: 500 });
  }
}
