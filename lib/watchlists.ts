import { eq, and } from "drizzle-orm";
import { db } from "@/db/client";
import { watchlists } from "@/db/schema";

const INTERESTS_WATCHLIST_NAME = "My Interests";

/**
 * Looks up the user's "My Interests" watchlist without creating one —
 * for read-only contexts (e.g. showing a "View your watchlist" link) that
 * shouldn't provision an empty watchlist just because the page was visited.
 */
export async function getInterestsWatchlist(userId: number) {
  const [existing] = await db
    .select()
    .from(watchlists)
    .where(
      and(
        eq(watchlists.userId, userId),
        eq(watchlists.name, INTERESTS_WATCHLIST_NAME)
      )
    )
    .limit(1);

  return existing ?? null;
}

/**
 * Returns the user's "My Interests" watchlist (creating it if this is
 * their first sector/country follow). This is the single home for the
 * quick sector/market follow picker at /interests — it's a normal
 * watchlist like any other, just auto-provisioned so that flow doesn't
 * need the user to create a list first.
 */
export async function getOrCreateInterestsWatchlist(userId: number) {
  const [existing] = await db
    .select()
    .from(watchlists)
    .where(
      and(
        eq(watchlists.userId, userId),
        eq(watchlists.name, INTERESTS_WATCHLIST_NAME)
      )
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(watchlists)
    .values({
      userId,
      name: INTERESTS_WATCHLIST_NAME,
      description: "Sectors and markets you're following for alerts.",
    })
    .returning();

  return created;
}
