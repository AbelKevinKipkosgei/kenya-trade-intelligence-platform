const stats = [
  { label: "Total Export Value", value: "$7.2B", change: "+4.8%" },
  { label: "Total Import Value", value: "$18.6B", change: "+2.1%" },
  { label: "Top Trade Partner", value: "China", change: "22% share" },
  { label: "Active Border Posts", value: "42", change: "monitored" },
];

const features = [
  {
    title: "Real-Time Customs Data",
    description:
      "Track shipments, tariffs, and clearance times across all major ports and border posts as they happen.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    ),
  },
  {
    title: "Tariff & Duty Tracking",
    description:
      "Stay ahead of EAC and COMESA tariff changes with automated alerts on rate revisions and exemptions.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 7h6m0 10v-3m-3 3v-6m-3 6v-9m-2 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    ),
  },
  {
    title: "Market Intelligence",
    description:
      "Spot emerging trade corridors and demand shifts with sector-level breakdowns and forecasting.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    ),
  },
];

import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-linear-to-b from-[#faf9f6] to-stone-100 dark:from-[#1c1c1e] dark:to-zinc-900">
      <div className="flex h-1 w-full">
        <div className="flex-1 bg-kenya-black" />
        <div className="flex-1 bg-kenya-red" />
        <div className="flex-1 bg-kenya-green" />
      </div>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-kenya-black text-sm font-bold text-white">
            KE
          </span>
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Trade Intelligence Platform
          </span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400 sm:flex">
          <a
            href="#overview"
            className="hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            Overview
          </a>
          <a
            href="#insights"
            className="hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            Insights
          </a>
          <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-50">
            Docs
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href="#overview"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Get Started
          </a>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 sm:px-10">
        <section className="flex flex-col items-start gap-6 py-20 sm:py-28">
          <span className="rounded-full bg-kenya-green/10 px-3 py-1 text-xs font-semibold text-kenya-green dark:bg-kenya-green/20">
            Live data across 42 border posts
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
            Understand Kenya&apos;s trade flows, in real time.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            A unified view of exports, imports, tariffs, and market trends —
            built for policymakers, exporters, and analysts who need answers
            fast.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#overview"
              className="flex h-12 items-center justify-center rounded-full bg-kenya-green px-6 text-sm font-semibold text-white transition-colors hover:bg-kenya-green/90"
            >
              Explore Dashboard
            </a>
            <a
              href="#"
              className="flex h-12 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Read the Docs
            </a>
          </div>
        </section>

        <section
          id="overview"
          className="grid grid-cols-2 gap-4 border-t border-zinc-200 py-12 dark:border-zinc-800 sm:grid-cols-4"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {stat.value}
              </span>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {stat.label}
              </span>
              <span className="mt-2 text-xs font-semibold text-kenya-green dark:text-green-400">
                {stat.change}
              </span>
            </div>
          ))}
        </section>

        <section id="insights" className="grid gap-6 py-16 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-kenya-green/10 text-kenya-green dark:bg-kenya-green/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {feature.icon}
                </svg>
              </span>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 border-t border-zinc-200 px-6 py-8 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500 sm:flex-row sm:px-10">
        <span>© 2026 Kenya Trade Intelligence Platform</span>
        <span>Built for data-driven trade policy</span>
      </footer>
    </div>
  );
}
