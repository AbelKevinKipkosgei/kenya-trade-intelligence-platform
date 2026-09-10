import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db/client";
import { watchlists, watchlistItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
    console.error("Check watchlist error:", error);
    return NextResponse.json(
      { error: "Failed to check watchlist status" },
      { status: 500 }
    );
  }
}
