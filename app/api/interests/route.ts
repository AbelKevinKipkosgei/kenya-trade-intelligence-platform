import { and, eq, inArray } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { watchlists, watchlistItems, sectors, countries } from "@/db/schema";
import { getOrCreateInterestsWatchlist } from "@/lib/watchlists";

// Sector/country follows for the alert-digest flow live in watchlist_items
// now (itemType "sector" | "country"), same table as every other tracked
// item — not a separate table, so this route is a thin adapter that
// reshapes those rows into the {id, sectorId, countryId} shape the
// InterestsPicker component expects, rather than a distinct data model.

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const userId = Number(session.user.id);

  const rows = await db
    .select({
      id: watchlistItems.id,
      itemType: watchlistItems.itemType,
      itemId: watchlistItems.itemId,
    })
    .from(watchlistItems)
    .innerJoin(watchlists, eq(watchlists.id, watchlistItems.watchlistId))
    .where(
      and(
        eq(watchlists.userId, userId),
        inArray(watchlistItems.itemType, ["sector", "country"])
      )
    );

  const interests = rows.map((r) => ({
    id: r.id,
    sectorId: r.itemType === "sector" ? r.itemId : null,
    countryId: r.itemType === "country" ? r.itemId : null,
  }));

  return Response.json({ interests });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const userId = Number(session.user.id);

  const body = await req.json().catch(() => null);
  const sectorId = typeof body?.sectorId === "number" ? body.sectorId : null;
  const countryId = typeof body?.countryId === "number" ? body.countryId : null;
  if (!sectorId && !countryId) {
    return new Response("Expected a sectorId or countryId.", { status: 400 });
  }

  const itemType = sectorId ? "sector" : "country";
  const itemId = sectorId ?? countryId!;

  // Toggle semantics: if this exact follow already exists (in any of the
  // user's watchlists), remove it instead of inserting a duplicate — keeps
  // the picker UI a simple click-to-toggle without needing a separate
  // "already following" check on the client.
  const [existing] = await db
    .select({ id: watchlistItems.id })
    .from(watchlistItems)
    .innerJoin(watchlists, eq(watchlists.id, watchlistItems.watchlistId))
    .where(
      and(
        eq(watchlists.userId, userId),
        eq(watchlistItems.itemType, itemType),
        eq(watchlistItems.itemId, itemId)
      )
    )
    .limit(1);

  if (existing) {
    await db.delete(watchlistItems).where(eq(watchlistItems.id, existing.id));
    return Response.json({ following: false });
  }

  const [item] = itemType === "sector"
    ? await db.select({ name: sectors.name }).from(sectors).where(eq(sectors.id, itemId)).limit(1)
    : await db.select({ name: countries.name }).from(countries).where(eq(countries.id, itemId)).limit(1);

  if (!item) {
    return new Response("Not found", { status: 404 });
  }

  const watchlist = await getOrCreateInterestsWatchlist(userId);

  await db.insert(watchlistItems).values({
    watchlistId: watchlist.id,
    itemType,
    itemId,
    itemName: item.name,
    alertsEnabled: true,
  });

  return Response.json({ following: true });
}
