import "../seed/load-env";
import { db } from "../client";
import {
  countries,
  products,
  tariffRateSnapshots,
  tariffs,
  watchlistItems,
  watchlists,
} from "../schema";
import { and, desc, eq, sql } from "drizzle-orm";
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

  let notificationCount = 0;
  let baselineCount = 0;

  for (const tracked of trackedItems) {
    if (!tracked.productId || !tracked.countryId) continue;

    const [current] = await db
      .select({
        productId: tariffs.productId,
        countryId: tariffs.countryId,
        rateType: tariffs.rateType,
        ratePercent: tariffs.ratePercent,
        rateSource: tariffs.rateSource,
        hsCode: products.hsCode,
        productDescription: products.description,
        countryName: countries.name,
      })
      .from(tariffs)
      .innerJoin(products, eq(products.id, tariffs.productId))
      .innerJoin(countries, eq(countries.id, tariffs.countryId))
      .where(
        and(
          eq(tariffs.productId, tracked.productId),
          eq(tariffs.countryId, tracked.countryId),
          eq(tariffs.rateType, "mfn"),
        ),
      )
      .orderBy(desc(tariffs.effectiveFrom))
      .limit(1);

    if (!current) continue;

    const [previous] = await db
      .select({ ratePercent: tariffRateSnapshots.ratePercent })
      .from(tariffRateSnapshots)
      .where(
        and(
          eq(tariffRateSnapshots.productId, current.productId),
          eq(tariffRateSnapshots.countryId, current.countryId),
          eq(tariffRateSnapshots.rateType, current.rateType),
        ),
      )
      .limit(1);

    const currentRate = Number(current.ratePercent);
    const previousRate = previous ? Number(previous.ratePercent) : null;

    if (previousRate === null) {
      baselineCount++;
    } else if (currentRate !== previousRate) {
      const rateChange = currentRate - previousRate;
      const usersTrackingPair = await db
        .selectDistinct({ userId: watchlists.userId })
        .from(watchlistItems)
        .innerJoin(watchlists, eq(watchlists.id, watchlistItems.watchlistId))
        .where(
          and(
            eq(watchlistItems.itemType, "opportunity"),
            eq(watchlistItems.alertsEnabled, true),
            sql`(${watchlistItems.itemMeta}->>'productId')::int = ${current.productId}`,
            sql`(${watchlistItems.itemMeta}->>'countryId')::int = ${current.countryId}`,
          ),
        );

      for (const { userId } of usersTrackingPair) {
        await createNotification({
          userId,
          type: "tariff_change",
          title: `Tariff changed: ${current.productDescription}`,
          message: `The MFN tariff for ${current.productDescription} in ${current.countryName} changed from ${previousRate.toFixed(3)}% to ${currentRate.toFixed(3)}%.`,
          relatedItemType: "product",
          relatedItemId: current.productId,
          metadata: {
            hsCode: current.hsCode,
            countryName: current.countryName,
            oldValue: previousRate,
            newValue: currentRate,
            changePercent: previousRate === 0 ? null : (rateChange / previousRate) * 100,
            actionUrl: `/explorer?product=${current.productId}&country=${current.countryId}`,
          },
        });
        notificationCount++;
      }
    }

    await db
      .insert(tariffRateSnapshots)
      .values({
        productId: current.productId,
        countryId: current.countryId,
        rateType: current.rateType,
        ratePercent: current.ratePercent,
        rateSource: current.rateSource,
        observedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          tariffRateSnapshots.productId,
          tariffRateSnapshots.countryId,
          tariffRateSnapshots.rateType,
        ],
        set: {
          ratePercent: current.ratePercent,
          rateSource: current.rateSource,
          observedAt: new Date(),
        },
      });
  }

  console.log(
    `✓ Checked for tariff changes (${baselineCount} baselines, ${notificationCount} notifications)`,
  );
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
