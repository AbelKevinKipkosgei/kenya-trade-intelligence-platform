"use client";

import { StatsCards } from "./stats-cards";
import { RecentActivity } from "./recent-activity";
import { WatchlistPreview } from "./watchlist-preview";
import { ExporterRecommendations } from "./exporter-recommendations";
import { OfficerOverview } from "./officer-overview";
import { QuickActions } from "./quick-actions";

export interface ExporterRoleData {
  profile: {
    businessName: string | null;
    sectorName: string | null;
    productsOffered: string[] | null;
    primaryMarkets: string[] | null;
  } | null;
  opportunities: Array<{
    id: number;
    productDescription: string;
    hsCode: string;
    countryName: string;
    overallScore: string;
  }>;
  barriers: Array<{
    id: number;
    countryName: string;
    barrierType: string;
    description: string;
    impactLevel: string;
  }>;
}

export interface OfficerRoleData {
  profile: {
    agencyName: string | null;
    department: string | null;
    level: string | null;
  } | null;
  sectorStats: Array<{
    sectorName: string;
    exporterCount: number;
    opportunityCount: number;
  }>;
  recentBarriers: Array<{
    id: number;
    countryName: string;
    productDescription: string | null;
    sectorName: string | null;
    barrierType: string;
    impactLevel: string;
    reportedDate: string;
  }>;
}

interface DashboardViewProps {
  userName: string;
  userRole: string;
  stats: {
    totalWatchlists: number;
    totalItems: number;
    productCount: number;
    opportunityCount: number;
    barrierCount: number;
    exporterCount: number;
    countryCount: number;
  };
  recentActivity: Array<{
    id: number;
    itemType: string;
    itemName: string;
    itemMeta: Record<string, unknown> | null;
    watchlistName: string;
    addedAt: Date;
  }>;
  watchlists: Array<{
    id: number;
    name: string;
    description: string | null;
    isDefault: boolean;
    itemCount: number;
  }>;
  // Shape depends on userRole (exporter vs officer) — the page only ever
  // populates one or the other, never both, so a discriminated cast at the
  // two render sites below is correct rather than a workaround.
  roleSpecificData: ExporterRoleData | OfficerRoleData | null;
}

export function DashboardView({
  userName,
  userRole,
  stats,
  recentActivity,
  watchlists,
  roleSpecificData,
}: DashboardViewProps) {
  const greeting = getGreeting();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-white dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10 sm:px-10">
        {/* Welcome Header - matching homepage border treatment */}
        <div className="mb-10 border-l-4 border-kenya-green pl-4">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            {greeting}, {userName}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {getRoleDescription(userRole)}
          </p>
        </div>

        {/* Quick Stats */}
        <StatsCards stats={stats} />

        {/* Main Content Grid */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.35fr_0.65fr]">
          {/* Left Column - Activity & Role-Specific */}
          <div className="space-y-10">
            {/* Quick Actions */}
            <QuickActions userRole={userRole} />

            {/* Recent Activity */}
            <RecentActivity activities={recentActivity} />

            {/* Role-Specific Section */}
            {userRole === "exporter" && roleSpecificData && (
              <ExporterRecommendations
                data={roleSpecificData as ExporterRoleData}
              />
            )}
            {userRole === "officer" && roleSpecificData && (
              <OfficerOverview data={roleSpecificData as OfficerRoleData} />
            )}
          </div>

          {/* Right Column - Watchlists Preview */}
          <div>
            <WatchlistPreview watchlists={watchlists} />
          </div>
        </div>
      </main>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getRoleDescription(role: string): string {
  switch (role) {
    case "exporter":
      return "Track opportunities and grow your export business";
    case "officer":
      return "Monitor trade activities and support exporters";
    default:
      return "Welcome to Kenya Trade Intelligence Platform";
  }
}
