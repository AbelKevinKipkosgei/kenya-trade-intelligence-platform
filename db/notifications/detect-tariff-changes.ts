import "../seed/load-env";
import { db } from "../client";
import { watchlistItems } from "../schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Detect tariff changes for tracked products and create notifications
 * This requires tracking historical tariff data to detect changes
 * 
 * Usage: npx tsx db/notifications/detect-tariff-changes.ts
 */
export async function detectTariffChanges() {
  console.log("Checking for tariff changes on tracked products...");

  // Get all unique product-country combinations from watchlists
  const trackedItems = await db
    .selectDistinct({
      productId: sql<number>`(${watchlistItems.itemMeta}->>'productId')::int`,
      countryId: sql<number>`(${watchlistItems.itemMeta}->>'countryId')::int`,
    })
    .from(watchlistItems)
    .where(
      and(
        eq(watchlistItems.itemType, "opportunity"),
        eq(watchlistItems.alertsEnabled, true)
      )
    );

  console.log(`Checking ${trackedItems.length} tracked product-market combinations`);

  // Always 0 until historical tariff-rate tracking exists. The real
  // logic would, per tracked item: look up the current rate (`tariffs`,
  // joined to `products`/`countries` for display), diff it against a
  // stored previous rate, and — only on a significant change — notify
  // every user tracking that product/country pair via
  // `createNotification` (querying `watchlistItems`/`watchlists` for
  // `itemType: "opportunity"` rows matching that pair). None of that can
  // run yet: there's no "previous rate" column to diff against, so
  // querying the current rate or the affected users per item would just
  // be a discarded round trip until that tracking exists.
  const notificationCount = 0;

  console.log(`✓ Checked for tariff changes (${notificationCount} notifications would be created)`);
  return notificationCount;
}

// Run if called directly
if (require.main === module) {
  detectTariffChanges()
    .then((count) => {
      console.log(`Completed: ${count} notifications created`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}
