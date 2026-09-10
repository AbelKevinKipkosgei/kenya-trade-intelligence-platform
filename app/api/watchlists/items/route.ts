import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db/client";
import { watchlists, watchlistItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/watchlists/items?watchlistId={id}
 * Fetch all items in a specific watchlist.
 */
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const userId = parseInt(session.user.id);

    const { searchParams } = new URL(request.url);
    const watchlistId = searchParams.get("watchlistId");

    if (!watchlistId) {
      return NextResponse.json(
        { error: "Watchlist ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership of watchlist
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

    // Fetch items
    const items = await db
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.watchlistId, parseInt(watchlistId)))
      .orderBy(watchlistItems.addedAt);

    return NextResponse.json({ items, watchlist });
  } catch (error) {
    console.error("Fetch watchlist items error:", error);
    return NextResponse.json(
      { error: "Failed to fetch watchlist items" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/watchlists/items
 * Add an item to a watchlist.
 */
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const userId = parseInt(session.user.id);
    const body = await request.json();

    const { watchlistId, itemType, itemId, itemName, itemMeta, notes } = body;

    if (!watchlistId || !itemType || !itemId || !itemName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify ownership of watchlist
    const [watchlist] = await db
      .select()
      .from(watchlists)
      .where(
        and(eq(watchlists.id, watchlistId), eq(watchlists.userId, userId))
      )
      .limit(1);

    if (!watchlist) {
      return NextResponse.json(
        { error: "Watchlist not found or access denied" },
        { status: 404 }
      );
    }

    // Check if item already exists in this watchlist
    const [existing] = await db
      .select()
      .from(watchlistItems)
      .where(
        and(
          eq(watchlistItems.watchlistId, watchlistId),
          eq(watchlistItems.itemType, itemType),
          eq(watchlistItems.itemId, itemId)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Item already in watchlist", item: existing },
        { status: 409 }
      );
    }

    // Add item
    const [item] = await db
      .insert(watchlistItems)
      .values({
        watchlistId,
        itemType,
        itemId,
        itemName,
        itemMeta: itemMeta || null,
        notes: notes || null,
        alertsEnabled: true,
      })
      .returning();

    // Update watchlist timestamp
    await db
      .update(watchlists)
      .set({ updatedAt: new Date() })
      .where(eq(watchlists.id, watchlistId));

    return NextResponse.json({ item, success: true }, { status: 201 });
  } catch (error) {
    console.error("Add watchlist item error:", error);
    return NextResponse.json(
      { error: "Failed to add item to watchlist" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/watchlists/items?id={itemId}
 * Remove an item from a watchlist.
 */
export async function DELETE(request: Request) {
  try {
    const session = await requireAuth();
    const userId = parseInt(session.user.id);

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("id");

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Fetch item and verify ownership via watchlist
    const [item] = await db
      .select({
        item: watchlistItems,
        watchlist: watchlists,
      })
      .from(watchlistItems)
      .innerJoin(watchlists, eq(watchlistItems.watchlistId, watchlists.id))
      .where(eq(watchlistItems.id, parseInt(itemId)))
      .limit(1);

    if (!item || item.watchlist.userId !== userId) {
      return NextResponse.json(
        { error: "Item not found or access denied" },
        { status: 404 }
      );
    }

    await db.delete(watchlistItems).where(eq(watchlistItems.id, parseInt(itemId)));

    // Update watchlist timestamp
    await db
      .update(watchlists)
      .set({ updatedAt: new Date() })
      .where(eq(watchlists.id, item.watchlist.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete watchlist item error:", error);
    return NextResponse.json(
      { error: "Failed to remove item from watchlist" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/watchlists/items?id={itemId}
 * Update item notes or alerts setting.
 */
export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const userId = parseInt(session.user.id);

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("id");
    const body = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Fetch item and verify ownership
    const [item] = await db
      .select({
        item: watchlistItems,
        watchlist: watchlists,
      })
      .from(watchlistItems)
      .innerJoin(watchlists, eq(watchlistItems.watchlistId, watchlists.id))
      .where(eq(watchlistItems.id, parseInt(itemId)))
      .limit(1);

    if (!item || item.watchlist.userId !== userId) {
      return NextResponse.json(
        { error: "Item not found or access denied" },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(watchlistItems)
      .set({
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.alertsEnabled !== undefined && {
          alertsEnabled: body.alertsEnabled,
        }),
      })
      .where(eq(watchlistItems.id, parseInt(itemId)))
      .returning();

    return NextResponse.json({ item: updated, success: true });
  } catch (error) {
    console.error("Update watchlist item error:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}
