import "dotenv/config";
import { db } from "../client";
import { marketOpportunityScores, watchlistItems, products, countries, watchlists } from "../schema";
import { eq, and, sql } from "drizzle-orm";
import { createNotification } from "./create-notification";

/**
 * Detect significant opportunity score changes for tracked opportunities
 * Notifies users when scores change by more than 5 points
 * 
 * Usage: npx tsx db/notifications/detect-opportunity-changes.ts
 */
export async function detectOpportunityChanges() {
  console.log("Checking for opportunity score changes...");

  // Get all tracked opportunities
  const trackedOpportunities = await db
    .select({
      opportunityId: watchlistItems.itemId,
      userId: watchlists.userId,
      itemName: watchlistItems.itemName,
      productId: sql<number>`(${watchlistItems.itemMeta}->>'productId')::int`,
      countryId: sql<number>`(${watchlistItems.itemMeta}->>'countryId')::int`,
      previousScore: sql<number>`(${watchlistItems.itemMeta}->>'score')::numeric`,
    })
    .from(watchlistItems)
    .innerJoin(watchlists, eq(watchlists.id, watchlistItems.watchlistId))
    .where(
      and(
        eq(watchlistItems.itemType, "opportunity"),
        eq(watchlistItems.alertsEnabled, true)
      )
    );

  console.log(`Checking ${trackedOpportunities.length} tracked opportunities`);

  let notificationCount = 0;

  for (const tracked of trackedOpportunities) {
    if (!tracked.productId || !tracked.countryId) continue;

    // Get current opportunity score
    const [currentData] = await db
      .select({
        id: marketOpportunityScores.id,
        overallScore: marketOpportunityScores.overallScore,
        productDescription: products.description,
        hsCode: products.hsCode,
        countryName: countries.name,
      })
      .from(marketOpportunityScores)
      .innerJoin(products, eq(products.id, marketOpportunityScores.productId))
      .innerJoin(countries, eq(countries.id, marketOpportunityScores.countryId))
      .where(
        and(
          eq(marketOpportunityScores.productId, tracked.productId),
          eq(marketOpportunityScores.countryId, tracked.countryId)
        )
      )
      .limit(1);

    if (!currentData) continue;

    const currentScore = Number(currentData.overallScore);
    const previousScore = tracked.previousScore ? Number(tracked.previousScore) : null;

    // Only notify if we have a previous score and change is significant (> 5 points)
    if (previousScore !== null && Math.abs(currentScore - previousScore) >= 5) {
      const scoreDiff = currentScore - previousScore;
      const direction = scoreDiff > 0 ? "increased" : "decreased";
      const emoji = scoreDiff > 0 ? "📈" : "📉";

      // Truncate long product descriptions for title
      const truncatedProduct = currentData.productDescription.length > 80
        ? currentData.productDescription.substring(0, 77) + "..."
        : currentData.productDescription;

      await createNotification({
        userId: tracked.userId,
        type: "opportunity_score_change",
        title: `${emoji} Opportunity score ${direction}: ${truncatedProduct}`,
        message: `The opportunity score for ${currentData.productDescription} in ${currentData.countryName} has ${direction} from ${previousScore.toFixed(1)} to ${currentScore.toFixed(1)} (${scoreDiff > 0 ? '+' : ''}${scoreDiff.toFixed(1)} points).`,
        relatedItemType: "opportunity",
        relatedItemId: currentData.id,
        metadata: {
          hsCode: currentData.hsCode,
          countryName: currentData.countryName,
          oldValue: previousScore,
          newValue: currentScore,
          changePercent: ((scoreDiff / previousScore) * 100).toFixed(1),
          actionUrl: `/opportunities`,
        },
      });
      notificationCount++;

      // Update the stored score in watchlist metadata
      await db
        .update(watchlistItems)
        .set({
          itemMeta: sql`jsonb_set(
            ${watchlistItems.itemMeta},
            '{score}',
            ${JSON.stringify(currentScore.toFixed(1))}
          )`,
        })
        .where(eq(watchlistItems.id, tracked.opportunityId));
    }
  }

  console.log(`✓ Created ${notificationCount} opportunity score change notifications`);
  return notificationCount;
}

// Run if called directly
if (require.main === module) {
  detectOpportunityChanges()
    .then((count) => {
      console.log(`Completed: ${count} notifications created`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}
