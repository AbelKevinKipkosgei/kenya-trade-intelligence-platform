"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { ThemeProvider } from "next-themes";
import { makeStore } from "@/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => makeStore());

  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </Provider>
  );
}
