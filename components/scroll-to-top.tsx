"use client";

import { useEffect, useState } from "react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 360);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-5 right-4 z-40 inline-flex h-10 items-center gap-2 border border-zinc-500 bg-ktp-navy px-3 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-[#1b466d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kenya-red sm:bottom-7 sm:right-7"
    >
      <span aria-hidden="true" className="text-base leading-none">
        ↑
      </span>
      Back to top
    </button>
  );
}
