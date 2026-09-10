import { requireAuth } from "@/lib/auth";
import { db } from "@/db/client";
import {
  watchlists,
  watchlistItems,
  marketOpportunityScores,
  tradeBarriers,
  exporters,
  products,
  sectors,
  countries,
  userProfiles,
  agencies,
} from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const revalidate = 60; // Revalidate every minute

/**
 * User dashboard page.
 * Shows personalized stats, activity, and recommendations.
 */
export default async function DashboardPage() {
  const session = await requireAuth();
  const userId = parseInt(session.user.id);
  const userRole = session.user.role;

  // Fetch watchlist stats
  const [watchlistStats] = await db
    .select({
      totalWatchlists: sql<number>`count(distinct ${watchlists.id})::int`,
      totalItems: sql<number>`count(${watchlistItems.id})::int`,
      productCount: sql<number>`count(case when ${watchlistItems.itemType} = 'product' then 1 end)::int`,
      opportunityCount: sql<number>`count(case when ${watchlistItems.itemType} = 'opportunity' then 1 end)::int`,
      barrierCount: sql<number>`count(case when ${watchlistItems.itemType} = 'barrier' then 1 end)::int`,
      exporterCount: sql<number>`count(case when ${watchlistItems.itemType} = 'exporter' then 1 end)::int`,
      countryCount: sql<number>`count(case when ${watchlistItems.itemType} = 'country' then 1 end)::int`,
    })
    .from(watchlists)
    .leftJoin(watchlistItems, eq(watchlists.id, watchlistItems.watchlistId))
    .where(eq(watchlists.userId, userId));

  // Fetch recent watchlist activity (last 5 items added)
  const recentActivity = await db
    .select({
      id: watchlistItems.id,
      itemType: watchlistItems.itemType,
      itemName: watchlistItems.itemName,
      itemMeta: watchlistItems.itemMeta,
      watchlistName: watchlists.name,
      addedAt: watchlistItems.addedAt,
    })
    .from(watchlistItems)
    .innerJoin(watchlists, eq(watchlists.id, watchlistItems.watchlistId))
    .where(eq(watchlists.userId, userId))
    .orderBy(desc(watchlistItems.addedAt))
    .limit(5);

  // Fetch user's watchlists with item counts
  const userWatchlists = await db
    .select({
      id: watchlists.id,
      name: watchlists.name,
      description: watchlists.description,
      isDefault: watchlists.isDefault,
      itemCount: sql<number>`count(${watchlistItems.id})::int`,
    })
    .from(watchlists)
    .leftJoin(watchlistItems, eq(watchlists.id, watchlistItems.watchlistId))
    .where(eq(watchlists.userId, userId))
    .groupBy(watchlists.id)
    .orderBy(desc(watchlists.isDefault), desc(watchlists.createdAt))
    .limit(3);

  // Fetch role-specific data
  let roleSpecificData: any = null;

  if (userRole === "exporter") {
    // Fetch exporter profile with sector info
    const [profile] = await db
      .select({
        businessRegistrationNumber: userProfiles.businessRegistrationNumber,
        businessType: userProfiles.businessType,
        primarySectorId: userProfiles.primarySectorId,
        sectorName: sectors.name,
      })
      .from(userProfiles)
      .leftJoin(sectors, eq(sectors.id, userProfiles.primarySectorId))
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (profile && profile.primarySectorId) {
      // Fetch top opportunities in exporter's sector
      const topOpportunities = await db
        .select({
          id: marketOpportunityScores.id,
          productDescription: products.description,
          hsCode: products.hsCode,
          countryName: countries.name,
          overallScore: marketOpportunityScores.overallScore,
        })
        .from(marketOpportunityScores)
        .innerJoin(products, eq(products.id, marketOpportunityScores.productId))
        .innerJoin(countries, eq(countries.id, marketOpportunityScores.countryId))
        .where(eq(products.sectorId, profile.primarySectorId))
        .orderBy(desc(marketOpportunityScores.overallScore))
        .limit(5);

      // Fetch active barriers in exporter's sector
      const activeBarriers = await db
        .select({
          id: tradeBarriers.id,
          countryName: countries.name,
          barrierType: tradeBarriers.barrierType,
          description: tradeBarriers.description,
          impactLevel: tradeBarriers.impactLevel,
        })
        .from(tradeBarriers)
        .innerJoin(products, eq(products.id, tradeBarriers.productId))
        .innerJoin(countries, eq(countries.id, tradeBarriers.countryId))
        .where(
          and(
            eq(products.sectorId, profile.primarySectorId),
            eq(tradeBarriers.status, "active")
          )
        )
        .orderBy(desc(tradeBarriers.reportedDate))
        .limit(5);

      roleSpecificData = {
        profile: {
          businessName: profile.businessRegistrationNumber,
          sectorName: profile.sectorName,
          productsOffered: null,
          primaryMarkets: null,
        },
        opportunities: topOpportunities,
        barriers: activeBarriers,
      };
    }
  } else if (userRole === "officer") {
    // Fetch officer profile
    const [profile] = await db
      .select({
        agencyName: agencies.name,
        department: userProfiles.department,
        level: userProfiles.officerLevel,
      })
      .from(userProfiles)
      .leftJoin(agencies, eq(agencies.id, userProfiles.agencyId))
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    // Fetch sector statistics
    const sectorStats = await db
      .select({
        sectorName: sectors.name,
        exporterCount: sql<number>`count(distinct ${exporters.id})::int`,
        opportunityCount: sql<number>`count(distinct ${marketOpportunityScores.id})::int`,
      })
      .from(sectors)
      .leftJoin(exporters, eq(exporters.sectorId, sectors.id))
      .leftJoin(
        marketOpportunityScores,
        eq(
          sql`${products.sectorId}`,
          sectors.id
        )
      )
      .groupBy(sectors.id, sectors.name)
      .orderBy(desc(sql`count(distinct ${exporters.id})`))
      .limit(5);

    // Fetch recent active barriers
    const recentBarriers = await db
      .select({
        id: tradeBarriers.id,
        countryName: countries.name,
        productDescription: products.description,
        sectorName: sectors.name,
        barrierType: tradeBarriers.barrierType,
        impactLevel: tradeBarriers.impactLevel,
        reportedDate: sql<string>`to_char(${tradeBarriers.reportedDate}, 'YYYY-MM-DD')`,
      })
      .from(tradeBarriers)
      .leftJoin(products, eq(products.id, tradeBarriers.productId))
      .leftJoin(sectors, eq(sectors.id, products.sectorId))
      .innerJoin(countries, eq(countries.id, tradeBarriers.countryId))
      .where(eq(tradeBarriers.status, "active"))
      .orderBy(desc(tradeBarriers.reportedDate))
      .limit(5);

    roleSpecificData = {
      profile,
      sectorStats,
      recentBarriers,
    };
  }

  return (
    <DashboardView
      userName={session.user.name || "User"}
      userRole={userRole}
      stats={watchlistStats}
      recentActivity={recentActivity}
      watchlists={userWatchlists}
      roleSpecificData={roleSpecificData}
    />
  );
}
