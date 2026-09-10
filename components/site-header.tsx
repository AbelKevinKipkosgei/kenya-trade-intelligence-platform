"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { ScrollToTop } from "./scroll-to-top";

const NAV_LINKS = [
  { href: "/explorer", label: "Explorer" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/barriers", label: "Barriers" },
  { href: "/exporters", label: "Exporters" },
  { href: "/dashboards", label: "Dashboards" },
  { href: "/news", label: "News" },
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut({ callbackUrl: "/" });
  };

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
          <ThemeToggle />
          
          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
          ) : session ? (
            // Authenticated: Show user menu
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="hidden h-9 items-center justify-center gap-2 border border-zinc-400 bg-transparent px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kenya-red dark:border-zinc-600 dark:text-zinc-300 dark:hover:border-zinc-400 dark:hover:bg-zinc-800 sm:flex"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="max-w-[120px] truncate">{session.user.name}</span>
              </button>

              {/* User dropdown menu */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {session.user.name}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        {session.user.email}
                      </p>
                      <p className="mt-2 inline-block rounded bg-kenya-green/10 px-2 py-1 text-xs font-semibold text-kenya-green dark:bg-kenya-green/20">
                        {session.user.role.charAt(0).toUpperCase() +
                          session.user.role.slice(1)}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Profile Settings
                      </Link>
                      <Link
                        href="/watchlists"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        My Watchlists
                      </Link>
                      {(session.user.role === "admin" ||
                        session.user.role === "officer") && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          Admin Panel
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-zinc-200 py-1 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="block w-full px-4 py-2 text-left text-sm text-kenya-red hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            // Not authenticated: Show sign in button
            <Link
              href="/auth/signin"
              className="hidden h-9 items-center justify-center border border-zinc-400 bg-transparent px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kenya-red dark:border-zinc-600 dark:text-zinc-300 dark:hover:border-zinc-400 dark:hover:bg-zinc-800 sm:flex"
            >
              Sign In
            </Link>
          )}

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
          {session && (
            <>
              <div className="my-2 border-t border-zinc-200 dark:border-zinc-800" />
              <div className="rounded-lg px-3 py-3 hover:bg-stone-200 dark:hover:bg-zinc-800">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Dashboard
                </Link>
              </div>
              <div className="rounded-lg px-3 py-3 hover:bg-stone-200 dark:hover:bg-zinc-800">
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Profile
                </Link>
              </div>
              <div className="rounded-lg px-3 py-3 hover:bg-stone-200 dark:hover:bg-zinc-800">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleSignOut();
                  }}
                  className="text-kenya-red"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
          {!session && (
            <>
              <div className="my-2 border-t border-zinc-200 dark:border-zinc-800" />
              <div className="rounded-lg px-3 py-3 hover:bg-stone-200 dark:hover:bg-zinc-800">
                <Link
                  href="/auth/signin"
                  onClick={() => setMobileOpen(false)}
                  className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Sign In
                </Link>
              </div>
            </>
          )}
        </nav>
      )}
    </>
  );
}
