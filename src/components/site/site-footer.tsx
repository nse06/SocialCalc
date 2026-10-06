import Link from "next/link";
import { LANDING_PAGES } from "@/lib/content/landing-pages";
import { LogoMark } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_2fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="font-semibold tracking-tight">How Much Should I Charge?</span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            A free, transparent brand-deal calculator for creators. Rates are planning estimates and negotiation starting
            points — not guarantees.
          </p>
          <Link
            href="/calculator"
            className="mt-5 inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-[#262532]"
          >
            Calculate my rate
          </Link>
        </div>
        <div className="grid gap-8 sm:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="text-[12px] font-semibold tracking-[0.08em] text-muted uppercase">Calculators</h2>
            <ul className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {LANDING_PAGES.map((page) => (
                <li key={page.slug}>
                  <Link href={`/${page.slug}`} className="text-ink-soft transition-colors hover:text-ink">
                    {page.linkLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-[12px] font-semibold tracking-[0.08em] text-muted uppercase">Learn</h2>
            <ul className="mt-3 grid gap-2 text-sm">
              <li>
                <Link href="/methodology" className="text-ink-soft transition-colors hover:text-ink">
                  Methodology
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-ink-soft transition-colors hover:text-ink">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-[12.5px] text-muted sm:px-6">
          Not financial, legal, or tax advice. Creator rates vary widely — use your judgment.
        </p>
      </div>
    </footer>
  );
}
