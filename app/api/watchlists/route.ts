import { NextResponse } from "next/server";
import { requireAuth, isUnauthorizedError } from "@/lib/auth";
import { db } from "@/db/client";
import { watchlists, watchlistItems } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * GET /api/watchlists
 * Fetch all watchlists for the current user with item counts.
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = parseInt(session.user.id);

    // Fetch watchlists with item counts
    const userWatchlists = await db
      .select({
        id: watchlists.id,
        name: watchlists.name,
        description: watchlists.description,
        isDefault: watchlists.isDefault,
        createdAt: watchlists.createdAt,
        updatedAt: watchlists.updatedAt,
        itemCount: sql<number>`count(${watchlistItems.id})::int`,
      })
      .from(watchlists)
      .leftJoin(watchlistItems, eq(watchlists.id, watchlistItems.watchlistId))
      .where(eq(watchlists.userId, userId))
      .groupBy(watchlists.id)
      .orderBy(watchlists.createdAt);

    return NextResponse.json({ watchlists: userWatchlists });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Fetch watchlists error:", error);
    return NextResponse.json(
      { error: "Failed to fetch watchlists" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/watchlists
 * Create a new watchlist for the current user.
 */
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const userId = parseInt(session.user.id);
    const body = await request.json();

    const { name, description, isDefault } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Watchlist name is required" },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db
        .update(watchlists)
        .set({ isDefault: false })
        .where(eq(watchlists.userId, userId));
    }

    const [watchlist] = await db
      .insert(watchlists)
      .values({
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        isDefault: isDefault || false,
      })
      .returning();

    return NextResponse.json({ watchlist, success: true }, { status: 201 });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create watchlist error:", error);
    return NextResponse.json(
      { error: "Failed to create watchlist" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/watchlists?id={watchlistId}
 * Delete a watchlist (and all its items via cascade).
 */
export async function DELETE(request: Request) {
  try {
    const session = await requireAuth();
    const userId = parseInt(session.user.id);

    const { searchParams } = new URL(request.url);
    const watchlistId = searchParams.get("id");

    if (!watchlistId) {
      return NextResponse.json(
        { error: "Watchlist ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership before deleting
    const [watchlist] = await db
      .select()
      .from(watchlists)
      .where(
        and(
          eq(watchlists.id, parseInt(watchlistId)),
          eq(watchlists.userId, userId)
        )
      )
      .limit(1);

    if (!watchlist) {
      return NextResponse.json(
        { error: "Watchlist not found or access denied" },
        { status: 404 }
      );
    }

    await db
      .delete(watchlists)
      .where(eq(watchlists.id, parseInt(watchlistId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Delete watchlist error:", error);
    return NextResponse.json(
      { error: "Failed to delete watchlist" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/watchlists?id={watchlistId}
 * Update a watchlist's name, description, or default status.
 */
export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const userId = parseInt(session.user.id);

    const { searchParams } = new URL(request.url);
    const watchlistId = searchParams.get("id");
    const body = await request.json();

    if (!watchlistId) {
      return NextResponse.json(
        { error: "Watchlist ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const [watchlist] = await db
      .select()
      .from(watchlists)
      .where(
        and(
          eq(watchlists.id, parseInt(watchlistId)),
          eq(watchlists.userId, userId)
        )
      )
      .limit(1);

    if (!watchlist) {
      return NextResponse.json(
        { error: "Watchlist not found or access denied" },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (body.isDefault) {
      await db
        .update(watchlists)
        .set({ isDefault: false })
        .where(eq(watchlists.userId, userId));
    }

    const [updated] = await db
      .update(watchlists)
      .set({
        ...(body.name && { name: body.name.trim() }),
        ...(body.description !== undefined && {
          description: body.description?.trim() || null,
        }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
        updatedAt: new Date(),
      })
      .where(eq(watchlists.id, parseInt(watchlistId)))
      .returning();

    return NextResponse.json({ watchlist: updated, success: true });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Update watchlist error:", error);
    return NextResponse.json(
      { error: "Failed to update watchlist" },
      { status: 500 }
    );
  }
}
