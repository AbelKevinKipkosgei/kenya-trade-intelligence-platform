"use client";

import Link from "next/link";

interface ExporterRecommendationsProps {
  data: {
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
  };
}

export function ExporterRecommendations({
  data,
}: ExporterRecommendationsProps) {
  const { profile, opportunities, barriers } = data;

  return (
    <div className="space-y-10">
      {/* Top Opportunities in Sector */}
      <section className="border-t-4 border-kenya-green bg-zinc-50 p-6 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
              Top Opportunities{" "}
              {profile?.sectorName && `in ${profile.sectorName}`}
            </h2>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              High-scoring market opportunities in your sector
            </p>
          </div>
          <Link
            href="/opportunities"
            className="text-sm font-medium text-kenya-green transition-colors hover:text-[#004d00]"
          >
            View all →
          </Link>
        </div>

        {opportunities.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No opportunities found in your sector.
          </p>
        ) : (
          <div className="space-y-3">
            {opportunities.map((opp) => (
              <Link
                key={opp.id}
                href={`/explorer?hs=${opp.hsCode}`}
                className="block border-l-4 border-kenya-green/30 bg-white p-4 transition-colors hover:border-kenya-green dark:bg-zinc-800/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-zinc-950 dark:text-white line-clamp-2">
                      {opp.productDescription}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-kenya-green">
                      {opp.countryName}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      HS {opp.hsCode}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-2xl font-semibold text-zinc-950 dark:text-white">
                      {Number(opp.overallScore).toFixed(1)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Score
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Active Barriers */}
      {barriers.length > 0 && (
        <section className="border-t-4 border-kenya-red bg-zinc-50 p-6 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                Active Barriers in Your Sector
              </h2>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Current trade barriers affecting your products
              </p>
            </div>
            <Link
              href="/barriers"
              className="text-sm font-medium text-kenya-red transition-colors hover:text-red-700"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {barriers.slice(0, 3).map((barrier) => (
              <div
                key={barrier.id}
                className="border-l-4 border-kenya-red/30 bg-white p-4 dark:bg-zinc-800/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-zinc-950 dark:text-white">
                        {barrier.countryName}
                      </h3>
                      <span className="bg-kenya-red/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-kenya-red">
                        {barrier.impactLevel} impact
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                      {barrier.barrierType}
                    </p>
                    <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">
                      {barrier.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
