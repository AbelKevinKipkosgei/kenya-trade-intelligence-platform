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
    <div className="space-y-6">
      {/* Top Opportunities in Sector */}
      <section className="border-t-4 border-amber-500 bg-white p-6 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
              Top Opportunities{" "}
              {profile?.sectorName && `in ${profile.sectorName}`}
            </h2>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              High-scoring market opportunities in your sector
            </p>
          </div>
          <Link
            href="/opportunities"
            className="text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400"
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
                className="block border-l-4 border-amber-500/30 bg-amber-50 p-3 transition-colors hover:border-amber-500 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-zinc-950 dark:text-white line-clamp-2">
                      {opp.productDescription}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      Market: {opp.countryName} · HS {opp.hsCode}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-semibold text-amber-600 dark:text-amber-400">
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
        <section className="border-t-4 border-red-500 bg-white p-6 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                Active Barriers in Your Sector
              </h2>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Current trade barriers affecting your products
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
            {barriers.slice(0, 3).map((barrier) => (
              <div
                key={barrier.id}
                className="border-l-4 border-red-500/30 bg-red-50 p-3 dark:bg-red-950/20"
              >
                <div className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-950 dark:text-white">
                        {barrier.countryName}
                      </h3>
                      <span className="rounded bg-red-600/20 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                        {barrier.impactLevel} impact
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      {barrier.barrierType}
                    </p>
                    <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">
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
