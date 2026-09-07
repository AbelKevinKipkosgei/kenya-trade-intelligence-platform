"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { ThemeProvider } from "next-themes";
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
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) return;
    originalError.apply(console, args);
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => makeStore());

  return (
    <Provider store={store}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
      >
        {children}
      </ThemeProvider>
    </Provider>
  );
}
