"use client";

import { useState } from "react";

export default function DashboardsPage() {
  const [hasError1, setHasError1] = useState(false);
  const [hasError2, setHasError2] = useState(false);
  
  const opportunitiesUrl =
    "https://ig-staging.pathwaystechnologies.com/analytics/superset/dashboard/p/BpreMG7MZ9z/?standalone=1";
  const tradePerformanceUrl =
    "https://ig-staging.pathwaystechnologies.com/analytics/superset/dashboard/p/4Ny1jYyjOR6/";

  return (
    <main className="flex min-h-screen w-full flex-col">
      <div className="w-full border-b border-zinc-200 bg-white px-6 py-8 dark:border-zinc-800 dark:bg-zinc-950 sm:px-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Dashboards
        </h1>
        <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
          Interactive analytics and insights for trade opportunities and tariffs
        </p>
      </div>

      <div className="flex-1 bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto w-full max-w-[2000px] space-y-8 px-6 py-8 sm:px-10">
          {/* Opportunities & Tariffs Dashboard */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Dashboard */}
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    Opportunities & Tariffs Dashboard
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Real-time analytics on trade opportunities and tariff data
                  </p>
                </div>
                <div
                  className="relative w-full"
                  style={{ height: "calc(100vh - 300px)", minHeight: "600px" }}
                >
                  {hasError1 && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
                      <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
                          <svg
                            className="h-6 w-6 text-amber-600 dark:text-amber-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                            />
                          </svg>
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                          Dashboard Unavailable
                        </h3>
                        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                          The dashboard could not be loaded. This may be due to network issues,
                          server configuration, or access restrictions.
                        </p>
                        <a
                          href={opportunitiesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-md bg-kenya-green px-4 py-2 text-sm font-medium text-white hover:bg-kenya-green/90"
                        >
                          Open in New Tab
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                  <iframe
                    src={opportunitiesUrl}
                    className="h-full w-full"
                    style={{ border: "none" }}
                    title="Opportunities & Tariffs Dashboard"
                    onError={() => setHasError1(true)}
                  />
                </div>
              </div>
            </div>

            {/* Overview Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Dashboard Overview
                  </h2>
                </div>
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-5">
                  <div className="space-y-6 text-sm">
                    <p className="text-zinc-700 dark:text-zinc-300">
                      This dashboard tracks export and trade opportunities across sectors alongside
                      tariff rates and trade agreements.
                    </p>

                    {/* KPIs */}
                    <div>
                      <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
                        Key Performance Indicators
                      </h3>
                      <div className="space-y-3">
                        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                          <div className="flex items-baseline justify-between">
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                              57.7
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              Avg Score
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Average opportunity score across all trade pairs (0-100 scale)
                          </p>
                        </div>

                        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                          <div className="flex items-baseline justify-between">
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                              36.8k
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              High-Opportunity
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Trade pairs with opportunity score ≥72.5
                          </p>
                        </div>

                        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                          <div className="flex items-baseline justify-between">
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                              15.1%
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              Avg MFN Rate
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Standard &ldquo;Most Favoured Nation&rdquo; tariff rate
                          </p>
                        </div>

                        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                          <div className="flex items-baseline justify-between">
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                              2.93%
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              Avg Preferential
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Average tariff under trade agreements (~12.2pp savings)
                          </p>
                        </div>

                        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                          <div className="flex items-baseline justify-between">
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                              23.7%
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              Real Data
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            23,619 of 99,664 tariff records are confirmed rates
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tariff Advantage */}
                    <div>
                      <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
                        Tariff Advantage by Agreement
                      </h3>
                      <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
                        Standard WTO-MFN tariffs at 15.1%, compared to preferential rates:
                      </p>
                      <div className="space-y-2">
                        {[
                          { name: "AGOA", rate: "1.03%" },
                          { name: "UK-EPA", rate: "1.46%" },
                          { name: "EU-EAC-EPA", rate: "1.98%" },
                          { name: "EAC-CU", rate: "2.52%" },
                          { name: "AfCFTA", rate: "3.03%" },
                          { name: "COMESA-FTA", rate: "3.98%" },
                        ].map((agreement) => (
                          <div
                            key={agreement.name}
                            className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900"
                          >
                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              {agreement.name}
                            </span>
                            <span className="text-xs font-semibold text-kenya-green">
                              {agreement.rate}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Sectors */}
                    <div>
                      <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
                        Top Sectors by Opportunity
                      </h3>
                      <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
                        Highest cumulative opportunity scores:
                      </p>
                      <div className="space-y-2">
                        {[
                          { name: "Agriculture & Horticulture", score: "2.57M" },
                          { name: "Manufacturing (General)", score: "2.40M" },
                          { name: "Textiles & Apparel", score: "2.06M" },
                          { name: "Automotive & Machinery", score: "1.56M" },
                        ].map((sector, idx) => (
                          <div
                            key={sector.name}
                            className="flex items-start justify-between gap-2 rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900"
                          >
                            <div className="flex items-start gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-kenya-green text-xs font-bold text-white">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                {sector.name}
                              </span>
                            </div>
                            <span className="shrink-0 text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                              {sector.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trade Performance Dashboard */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Dashboard */}
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    Trade Performance Dashboard
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Macro-level international trade flows and multi-year trends
                  </p>
                </div>
                <div
                  className="relative w-full"
                  style={{ height: "calc(100vh - 300px)", minHeight: "600px" }}
                >
                  {hasError2 && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
                      <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
                          <svg
                            className="h-6 w-6 text-amber-600 dark:text-amber-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                            />
                          </svg>
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                          Dashboard Unavailable
                        </h3>
                        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                          The dashboard could not be loaded. This may be due to network issues,
                          server configuration, or access restrictions.
                        </p>
                        <a
                          href={tradePerformanceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-md bg-kenya-green px-4 py-2 text-sm font-medium text-white hover:bg-kenya-green/90"
                        >
                          Open in New Tab
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                  <iframe
                    src={tradePerformanceUrl}
                    className="h-full w-full"
                    style={{ border: "none" }}
                    title="Trade Performance Dashboard"
                    onError={() => setHasError2(true)}
                  />
                </div>
              </div>
            </div>

            {/* Overview Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Dashboard Overview
                  </h2>
                </div>
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-5">
                  <div className="space-y-6 text-sm">
                    <p className="text-zinc-700 dark:text-zinc-300">
                      This dashboard monitors macro-level international trade flows, tracking total
                      trade volume, net balance, and multi-year comparative trends.
                    </p>

                    {/* Key Metrics */}
                    <div>
                      <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
                        Key Metrics
                      </h3>
                      <div className="space-y-3">
                        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                          <div className="flex items-baseline justify-between">
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                              $278.5B
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              Export Value
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Total value of domestic goods and services sold to external markets
                          </p>
                        </div>

                        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                          <div className="flex items-baseline justify-between">
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                              $245.4B
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              Import Value
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Total value of foreign goods and services purchased domestically
                          </p>
                        </div>

                        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                          <div className="flex items-baseline justify-between">
                            <span className="font-medium text-green-700 dark:text-green-400">
                              $33.1B
                            </span>
                            <span className="text-xs text-green-600 dark:text-green-500">
                              Trade Surplus
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                            Net positive balance (Exports − Imports)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* YoY Export Trend */}
                    <div>
                      <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
                        YoY Export Growth (2019-2024)
                      </h3>
                      <div className="space-y-2">
                        {[
                          { year: "2019", value: "$37.2B" },
                          { year: "2020", value: "$40.1B" },
                          { year: "2021", value: "$45.8B" },
                          { year: "2022", value: "$52.3B" },
                          { year: "2023", value: "$55.6B" },
                          { year: "2024", value: "$58.5B" },
                        ].map((item) => (
                          <div
                            key={item.year}
                            className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900"
                          >
                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              {item.year}
                            </span>
                            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 rounded-lg border border-kenya-green/20 bg-kenya-green/5 p-3">
                        <p className="text-xs font-medium text-kenya-green">
                          <span className="font-bold">+57.4%</span> growth from 2019 to 2024
                        </p>
                      </div>
                    </div>

                    {/* Visual Breakdown */}
                    <div>
                      <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
                        Visual Breakdown
                      </h3>
                      <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-kenya-green/20 text-[10px] font-bold text-kenya-green">
                            •
                          </span>
                          <p>
                            <strong className="text-zinc-900 dark:text-zinc-50">
                              Summary Cards:
                            </strong>{" "}
                            Top-line trade values and $33.1B surplus
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-kenya-green/20 text-[10px] font-bold text-kenya-green">
                            •
                          </span>
                          <p>
                            <strong className="text-zinc-900 dark:text-zinc-50">
                              Trend Charts:
                            </strong>{" "}
                            Exports grew 57.4% while imports rose from $33.0B to $51.3B
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-kenya-green/20 text-[10px] font-bold text-kenya-green">
                            •
                          </span>
                          <p>
                            <strong className="text-zinc-900 dark:text-zinc-50">
                              Export Destinations:
                            </strong>{" "}
                            $278.5B aggregated across trade partners
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
