import "dotenv/config";
import { db } from "../client";
import { tradeBarriers, watchlistItems, products, countries, watchlists } from "../schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { createNotification } from "./create-notification";

/**
 * Detect new barriers affecting tracked products/markets and create notifications
 * Run this script periodically (e.g., daily via cron job)
 * 
 * Usage: npx tsx db/notifications/detect-barriers.ts
 */
export async function detectNewBarriers() {
  console.log("Checking for new barriers affecting tracked items...");

  // Get barriers created in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const newBarriers = await db
    .select({
      barrierId: tradeBarriers.id,
      productId: tradeBarriers.productId,
      countryId: tradeBarriers.countryId,
      barrierType: tradeBarriers.barrierType,
      description: tradeBarriers.description,
      impactLevel: tradeBarriers.impactLevel,
      productDescription: products.description,
      hsCode: products.hsCode,
      countryName: countries.name,
    })
    .from(tradeBarriers)
    .innerJoin(products, eq(products.id, tradeBarriers.productId))
    .innerJoin(countries, eq(countries.id, tradeBarriers.countryId))
    .where(
      and(
        eq(tradeBarriers.status, "active"),
        gte(tradeBarriers.reportedDate, oneDayAgo)
      )
    );

  console.log(`Found ${newBarriers.length} new barriers`);

  let notificationCount = 0;

  for (const barrier of newBarriers) {
    // Find users tracking this product
    const usersTrackingProduct = await db
      .select({
        userId: watchlists.userId,
        itemName: watchlistItems.itemName,
      })
      .from(watchlistItems)
      .innerJoin(watchlists, eq(watchlists.id, watchlistItems.watchlistId))
      .where(
        and(
          eq(watchlistItems.itemType, "product"),
          eq(watchlistItems.itemId, barrier.productId!),
          eq(watchlistItems.alertsEnabled, true)
        )
      )
      .groupBy(watchlists.userId, watchlistItems.itemName);

    // Find users tracking this market (country)
    const usersTrackingMarket = await db
      .select({
        userId: watchlists.userId,
        itemName: watchlistItems.itemName,
      })
      .from(watchlistItems)
      .innerJoin(watchlists, eq(watchlists.id, watchlistItems.watchlistId))
      .where(
        and(
          eq(watchlistItems.itemType, "country"),
          eq(watchlistItems.itemId, barrier.countryId),
          eq(watchlistItems.alertsEnabled, true)
        )
      )
      .groupBy(watchlists.userId, watchlistItems.itemName);

    // Combine and deduplicate users
    const allUsers = [
      ...usersTrackingProduct,
      ...usersTrackingMarket,
    ];
    const uniqueUserIds = [...new Set(allUsers.map((u) => u.userId))];

    // Create notifications for affected users
    for (const userId of uniqueUserIds) {
      await createNotification({
        userId,
        type: "new_barrier",
        title: `New ${barrier.impactLevel} impact barrier: ${barrier.countryName}`,
        message: `A new ${barrier.barrierType} barrier has been reported in ${barrier.countryName} affecting ${barrier.productDescription} (HS ${barrier.hsCode}). ${barrier.description.substring(0, 150)}...`,
        relatedItemType: "barrier",
        relatedItemId: barrier.barrierId,
        metadata: {
          hsCode: barrier.hsCode,
          countryName: barrier.countryName,
          barrierType: barrier.barrierType,
          impactLevel: barrier.impactLevel,
          actionUrl: `/barriers`,
        },
      });
      notificationCount++;
    }
  }

  console.log(`✓ Created ${notificationCount} barrier notifications`);
  return notificationCount;
}

// Run if called directly
if (require.main === module) {
  detectNewBarriers()
    .then((count) => {
      console.log(`Completed: ${count} notifications created`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}
