import { NextResponse } from "next/server";
import { requireAuth, isUnauthorizedError } from "@/lib/auth";
import { db } from "@/db/client";
import { watchlists, watchlistItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const VALID_ITEM_TYPES = ["product", "country", "opportunity", "barrier", "exporter"] as const;
type ItemType = (typeof VALID_ITEM_TYPES)[number];

function isValidItemType(value: string): value is ItemType {
  return (VALID_ITEM_TYPES as readonly string[]).includes(value);
}

/**
 * GET /api/watchlists/check?itemType={type}&itemId={id}
 * Check if an item is in any of the user's watchlists.
 * Returns list of watchlists containing this item.
 */
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const userId = parseInt(session.user.id);

    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get("itemType");
    const itemId = searchParams.get("itemId");

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: "itemType and itemId are required" },
        { status: 400 }
      );
    }
    if (!isValidItemType(itemType)) {
      return NextResponse.json({ error: "Invalid itemType" }, { status: 400 });
    }

    // Find all watchlists for this user that contain this item
    const results = await db
      .select({
        watchlistId: watchlists.id,
        watchlistName: watchlists.name,
        itemId: watchlistItems.id,
      })
      .from(watchlistItems)
      .innerJoin(watchlists, eq(watchlistItems.watchlistId, watchlists.id))
      .where(
        and(
          eq(watchlists.userId, userId),
          eq(watchlistItems.itemType, itemType),
          eq(watchlistItems.itemId, parseInt(itemId))
        )
      );

    return NextResponse.json({
      inWatchlist: results.length > 0,
      watchlists: results,
    });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Check watchlist error:", error);
    return NextResponse.json(
      { error: "Failed to check watchlist status" },
      { status: 500 }
    );
  }
}
