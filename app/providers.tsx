"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { makeStore } from "@/store";

// next-themes injects a blocking inline <script> (via ThemeProvider, a
// Client Component) to set the theme class before hydration and avoid a
// flash of the wrong theme — it runs correctly as part of the initial
// server-rendered HTML. React 19 added a warning for any <script> tag
// rendered by a Client Component that doesn't distinguish this legitimate
// SSR-script case, and next-themes hasn't shipped a fix (unmaintained
// since early 2025 — see github.com/pacocoursey/next-themes/issues/387).
// This is the documented workaround: filter just this one dev-only
// console.error so it doesn't get mistaken for a real error.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag")
    )
      return;
    originalError.apply(console, args);
  };
}

// Next.js/Turbopack's dev-mode component-performance instrumentation calls
// performance.measure() around a client-side route transition, and can end
// up with a start mark after the end mark — the browser rejects that as a
// negative duration, crashing navigation with "Failed to execute 'measure'
// on 'Performance': '<PageName>' cannot have a negative time stamp."
// Confirmed upstream Next.js bug (github.com/vercel/next.js/issues/86060),
// not an application bug — no notFound()/redirect in this codebase
// triggers it, it's the dev overlay's own instrumentation racing itself.
// Swallow only that exact failure so a route transition never crashes on
// what is purely diagnostic instrumentation.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalMeasure = window.performance.measure.bind(window.performance);
  window.performance.measure = ((...args: Parameters<Performance["measure"]>) => {
    try {
      return originalMeasure(...args);
    } catch (err) {
      if (err instanceof DOMException && err.message.includes("cannot have a negative time stamp")) {
        return undefined as unknown as PerformanceMeasure;
      }
      throw err;
    }
  }) as Performance["measure"];
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => makeStore());

  return (
    <SessionProvider>
      <Provider store={store}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </Provider>
    </SessionProvider>
  );
}
