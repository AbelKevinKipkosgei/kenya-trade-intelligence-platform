import Image from "next/image";
import Link from "next/link";

const PLATFORM_LINKS = [
  { href: "/explorer", label: "Explorer" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/barriers", label: "Trade Barriers" },
  { href: "/exporters", label: "Exporters" },
  { href: "/news", label: "Trade News" },
  { href: "/getting-started", label: "Getting Started" },
  { href: "/analyst", label: "AI Trade Analyst" },
];

const SUPPORT_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "mailto:support@trade.go.ke", label: "Contact / Support" },
  { href: "/accessibility", label: "Accessibility Statement" },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t-0 bg-ktp-navy text-white">
      <div className="flex h-1 w-full" aria-hidden="true">
        <div className="flex-1 bg-kenya-black" />
        <div className="flex-1 bg-kenya-red" />
        <div className="flex-1 bg-kenya-green" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.35fr_0.8fr_1.1fr_0.85fr] lg:gap-12">
        <div>
          <Link href="/" className="inline-flex items-start gap-3 focus-visible:outline-white">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-white p-1">
              <Image
                src="/logo/logo.jpg"
                alt="Coat of arms of Kenya"
                width={44}
                height={44}
                className="h-10 w-10 object-contain"
              />
            </span>
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#b7d8c0]">
                KE — State Department for Trade
              </span>
              <span className="mt-1 block max-w-xs font-display text-2xl font-semibold leading-none">
                Kenya Trade Intelligence Platform
              </span>
            </span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-200">
            Public intelligence on Kenya&apos;s trade flows, market access, barriers, and export
            opportunities.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#b7d8c0]">Platform</h2>
          <nav aria-label="Platform links" className="mt-4 flex flex-col gap-2.5 text-sm text-slate-200">
            {PLATFORM_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="w-fit transition-colors hover:text-white focus-visible:outline-white">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#b7d8c0]">Data &amp; sources</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-200">
            Data sourced from:
          </p>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            <li><a href="https://www.kra.go.ke/" target="_blank" rel="noreferrer" className="text-white underline decoration-white/40 underline-offset-4 hover:decoration-white focus-visible:outline-white">Kenya Revenue Authority</a></li>
            <li><a href="https://www.knbs.or.ke/" target="_blank" rel="noreferrer" className="text-white underline decoration-white/40 underline-offset-4 hover:decoration-white focus-visible:outline-white">Kenya National Bureau of Statistics</a></li>
            <li><a href="https://www.trade.go.ke/" target="_blank" rel="noreferrer" className="text-white underline decoration-white/40 underline-offset-4 hover:decoration-white focus-visible:outline-white">State Department for Trade</a></li>
          </ul>
          <p className="mt-5 border-l-2 border-kenya-green pl-3 text-sm font-semibold text-white">
            Data last updated: December 2024
          </p>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#b7d8c0]">Legal &amp; support</h2>
          <nav aria-label="Legal and support links" className="mt-4 flex flex-col gap-2.5 text-sm text-slate-200">
            {SUPPORT_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="w-fit transition-colors hover:text-white focus-visible:outline-white">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-5 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <span>© 2026 Kenya Trade Intelligence Platform</span>
          <span>Built for data-driven trade policy</span>
        </div>
      </div>
    </footer>
  );
}
