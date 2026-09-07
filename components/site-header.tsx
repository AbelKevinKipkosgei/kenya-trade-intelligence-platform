"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { ScrollToTop } from "./scroll-to-top";

const NAV_LINKS = [
  { href: "/explorer", label: "Explorer" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/barriers", label: "Barriers" },
  { href: "/exporters", label: "Exporters" },
  { href: "/news", label: "News" },
  { href: "/getting-started", label: "Getting Started" },
  { href: "/analyst", label: "AI Analyst" },
];

function NavLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
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
      <header className="flex w-full items-center justify-between gap-2 border-b border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950 sm:gap-3 sm:px-10 sm:py-5">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2">
          <Image
            src="/logo/logo.jpg"
            alt="Coat of arms of Kenya"
            width={44}
            height={44}
            className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11"
            priority
          />
          <span className="min-w-0">
            <span className="block text-[9px] font-bold uppercase leading-tight tracking-[0.08em] text-zinc-500 dark:text-zinc-400 sm:text-[10px] sm:tracking-[0.12em]">
              State Department for Trade
            </span>
            <span className="block text-[11px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-sm">
              Kenya Trade Intelligence Platform
            </span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-5 text-sm font-medium xl:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Link
            href="/getting-started"
            className="hidden border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kenya-red dark:border-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 sm:inline-block"
          >
            Get Started
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-400 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300 xl:hidden"
          >
            {mobileOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      <ScrollToTop />

      {mobileOpen && (
        <nav className="flex w-full flex-col gap-1 border-t border-zinc-200 bg-white px-6 py-3 text-base font-medium shadow-md dark:border-zinc-700 dark:bg-zinc-900 sm:px-10 xl:hidden">
          {NAV_LINKS.map((link) => (
            <div
              key={link.href}
              className="rounded-lg px-3 py-3 hover:bg-stone-200 dark:hover:bg-zinc-800"
            >
              <NavLink {...link} onClick={() => setMobileOpen(false)} />
            </div>
          ))}
        </nav>
      )}
    </>
  );
}
