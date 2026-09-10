"use client";

import Link from "next/link";
import { StatsCards } from "./stats-cards";
import { RecentActivity } from "./recent-activity";
import { WatchlistPreview } from "./watchlist-preview";
import { ExporterRecommendations } from "./exporter-recommendations";
import { OfficerOverview } from "./officer-overview";
import { QuickActions } from "./quick-actions";

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
    itemMeta: Record<string, any> | null;
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
  roleSpecificData: any;
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
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-12">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="border-l-4 border-kenya-green pl-4">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              {greeting}, {userName}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {getRoleDescription(userRole)}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <StatsCards stats={stats} />

        {/* Main Content Grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Left Column - Activity & Watchlists */}
          <div className="space-y-6 lg:col-span-2">
            {/* Quick Actions */}
            <QuickActions userRole={userRole} />

            {/* Recent Activity */}
            <RecentActivity activities={recentActivity} />

            {/* Role-Specific Section */}
            {userRole === "exporter" && roleSpecificData && (
              <ExporterRecommendations data={roleSpecificData} />
            )}
            {userRole === "officer" && roleSpecificData && (
              <OfficerOverview data={roleSpecificData} />
            )}
          </div>

          {/* Right Column - Watchlists Preview */}
          <div className="lg:col-span-1">
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
