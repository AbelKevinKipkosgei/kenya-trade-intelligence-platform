"use client";

import Link from "next/link";

interface OfficerOverviewProps {
  data: {
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
  };
}

export function OfficerOverview({ data }: OfficerOverviewProps) {
  const { profile, sectorStats, recentBarriers } = data;

  return (
    <div className="space-y-6">
      {/* Sector Overview */}
      <section className="border-t-4 border-indigo-500 bg-white p-6 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
              Sector Overview
            </h2>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Export capacity and opportunities by sector
            </p>
          </div>
          <Link
            href="/exporters"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            View exporters →
          </Link>
        </div>

        {sectorStats.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No sector data available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                <tr>
                  <th className="pb-2 pr-4 font-semibold">Sector</th>
                  <th className="pb-2 pr-4 text-right font-semibold">
                    Exporters
                  </th>
                  <th className="pb-2 text-right font-semibold">
                    Opportunities
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {sectorStats.map((sector) => (
                  <tr key={sector.sectorName}>
                    <td className="py-3 pr-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {sector.sectorName}
                    </td>
                    <td className="py-3 pr-4 text-right text-zinc-600 dark:text-zinc-400">
                      {sector.exporterCount.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-zinc-600 dark:text-zinc-400">
                      {sector.opportunityCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent Active Barriers */}
      {recentBarriers.length > 0 && (
        <section className="border-t-4 border-red-500 bg-white p-6 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                Recent Active Barriers
              </h2>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Latest reported trade barriers requiring attention
              </p>
            </div>
            <Link
              href="/barriers"
              className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {recentBarriers.slice(0, 4).map((barrier) => (
              <div
                key={barrier.id}
                className="border-l-4 border-red-500/30 bg-red-50 p-3 dark:bg-red-950/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-zinc-950 dark:text-white">
                        {barrier.countryName}
                      </h3>
                      <span className="rounded bg-red-600/20 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                        {barrier.impactLevel} impact
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {barrier.barrierType}
                      </span>
                    </div>
                    {barrier.productDescription && barrier.sectorName && (
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        {barrier.productDescription} ({barrier.sectorName})
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(barrier.reportedDate).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                        }
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Agency Info */}
      {profile && (
        <section className="border-t-4 border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-semibold text-zinc-950 dark:text-white">
            Your Agency
          </h2>
          <div className="space-y-2 text-sm">
            {profile.agencyName && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-600 dark:text-zinc-400">
                  Agency:
                </span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {profile.agencyName}
                </span>
              </div>
            )}
            {profile.department && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-600 dark:text-zinc-400">
                  Department:
                </span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {profile.department}
                </span>
              </div>
            )}
            {profile.level && (
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-600 dark:text-zinc-400">
                  Level:
                </span>
                <span className="capitalize text-zinc-900 dark:text-zinc-100">
                  {profile.level}
                </span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
