import "../seed/load-env";
import { db } from "../client";
import { tariffs, watchlistItems, products, countries, watchlists } from "../schema";
import { eq, and, sql } from "drizzle-orm";
import { createNotification } from "./create-notification";

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

  // Always 0 until historical tariff-rate tracking exists — see the
  // commented-out block below, which is the actual notification logic
  // waiting on that data.
  const notificationCount = 0;

  for (const item of trackedItems) {
    if (!item.productId || !item.countryId) continue;

    // Get current and previous tariff rates
    // Note: This is a simplified example - in production you'd want to
    // track historical changes in a separate table
    const tariffData = await db
      .select({
        currentRate: tariffs.ratePercent,
        productDescription: products.description,
        hsCode: products.hsCode,
        countryName: countries.name,
        rateType: tariffs.rateType,
      })
      .from(tariffs)
      .innerJoin(products, eq(products.id, tariffs.productId))
      .innerJoin(countries, eq(countries.id, tariffs.countryId))
      .where(
        and(
          eq(tariffs.productId, item.productId),
          eq(tariffs.countryId, item.countryId)
        )
      )
      .limit(1);

    if (tariffData.length === 0) continue;

    const tariff = tariffData[0];

    // Find users tracking this opportunity
    const affectedUsers = await db
      .select({
        userId: watchlists.userId,
      })
      .from(watchlistItems)
      .innerJoin(watchlists, eq(watchlists.id, watchlistItems.watchlistId))
      .where(
        and(
          eq(watchlistItems.itemType, "opportunity"),
          sql`${watchlistItems.itemMeta}->>'productId' = ${item.productId.toString()}`,
          sql`${watchlistItems.itemMeta}->>'countryId' = ${item.countryId.toString()}`,
          eq(watchlistItems.alertsEnabled, true)
        )
      )
      .groupBy(watchlists.userId);

    // In a real implementation, you would:
    // 1. Store historical tariff rates
    // 2. Compare current vs. previous rates
    // 3. Only notify if change is significant (e.g., > 1%)

    // For now, we'll create a placeholder for the notification logic
    // Uncomment when you have historical data tracking:

    /*
    const changePercent = calculateChange(oldRate, newRate);
    
    if (Math.abs(changePercent) >= 1) {
      for (const user of affectedUsers) {
        await createNotification({
          userId: user.userId,
          type: "tariff_change",
          title: `Tariff change: ${tariff.productDescription} to ${tariff.countryName}`,
          message: `The tariff rate for ${tariff.productDescription} (HS ${tariff.hsCode}) to ${tariff.countryName} has changed from ${oldRate}% to ${tariff.currentRate}% (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%).`,
          relatedItemType: "product",
          relatedItemId: item.productId,
          metadata: {
            hsCode: tariff.hsCode,
            countryName: tariff.countryName,
            oldValue: oldRate,
            newValue: tariff.currentRate,
            changePercent,
            actionUrl: `/explorer?hs=${tariff.hsCode}`,
          },
        });
        notificationCount++;
      }
    }
    */
  }

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
