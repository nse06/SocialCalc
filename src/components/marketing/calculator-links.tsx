import Link from "next/link";
import { ArrowRight } from "@/components/ui/icons";
import { LANDING_PAGES, type LandingPage } from "@/lib/content/landing-pages";

function firstSentence(text: string) {
  const match = /^.*?[.!?](\s|$)/.exec(text);
  return (match ? match[0] : text).trim();
}

export function CalculatorLinks({ slugs, title = "More calculators" }: { slugs?: string[]; title?: string }) {
  const pages = slugs
    ? slugs.map((s) => LANDING_PAGES.find((p) => p.slug === s)).filter((p): p is LandingPage => Boolean(p))
    : LANDING_PAGES;
  return (
    <section aria-labelledby="calculator-links-heading">
      <h2 id="calculator-links-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <li key={page.slug}>
            <Link
              href={`/${page.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-[border-color,box-shadow] hover:border-accent-line hover:shadow-card"
            >
              <span className="flex items-center justify-between gap-3 text-[16px] font-semibold text-ink">
                {page.linkLabel}
                <ArrowRight size={17} className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
              </span>
              <span className="mt-1.5 text-[14px] leading-relaxed text-muted">{firstSentence(page.intro)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
