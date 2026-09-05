"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const NAV_LINKS = [
  { href: "/explorer", label: "Explorer" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/barriers", label: "Barriers" },
  { href: "/exporters", label: "Exporters" },
  { href: "/getting-started", label: "Getting Started" },
  { href: "/analyst", label: "AI Analyst" },
];

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "font-semibold text-kenya-green"
          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      }
    >
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="flex h-1 w-full">
        <div className="flex-1 bg-kenya-black" />
        <div className="flex-1 bg-kenya-red" />
        <div className="flex-1 bg-kenya-green" />
      </div>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-kenya-black text-sm font-bold text-white">
            KE
          </span>
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Trade Intelligence Platform
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/getting-started"
            className="hidden rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 sm:inline-block"
          >
            Get Started
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-400 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300 lg:hidden"
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-6 pb-4 text-sm font-medium sm:px-10 lg:hidden">
          {NAV_LINKS.map((link) => (
            <div key={link.href} className="rounded-lg px-3 py-2 hover:bg-stone-200 dark:hover:bg-zinc-800">
              <NavLink {...link} onClick={() => setMobileOpen(false)} />
            </div>
          ))}
        </nav>
      )}
    </>
  );
}
