import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { CtaBand } from "@/components/marketing/cta-band";
import { ArrowRight } from "@/components/ui/icons";
import { GUIDES, getLinkTarget } from "@/lib/content/landing-pages";

export const metadata: Metadata = {
  title: "Creator Rate Calculators for Every Platform and Deal",
  description:
    "Free calculators for pricing brand deals: Instagram, TikTok, YouTube, UGC, usage rights, whitelisting, exclusivity, and more — plus email templates for replying to brands.",
  alternates: { canonical: "/calculators" },
};

const GROUPS: { title: string; description: string; slugs: string[] }[] = [
  {
    title: "By platform",
    description: "Start from where the content will run.",
    slugs: [
      "instagram-rate-calculator",
      "instagram-reel-price-calculator",
      "instagram-story-price-calculator",
      "tiktok-rate-calculator",
      "tiktok-sponsorship-calculator",
      "youtube-rate-calculator",
      "youtube-shorts-sponsorship-calculator",
    ],
  },
  {
    title: "By deal term",
    description: "Price the rights and restrictions brands ask for.",
    slugs: ["usage-rights-calculator", "whitelisting-calculator", "exclusivity-fee-calculator"],
  },
  {
    title: "By creator and deal type",
    description: "General calculators for any deal.",
    slugs: ["brand-deal-calculator", "influencer-rate-calculator", "micro-influencer-rate-calculator", "ugc-rate-calculator"],
  },
  {
    title: "Guides",
    description: "What to say once you know your number.",
    slugs: GUIDES.map((g) => g.slug),
  },
];

export default function CalculatorsHub() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 sm:pt-12">
      <Breadcrumbs items={[{ name: "Calculators", href: "/calculators" }]} />
      <h1 className="mt-6 text-[2.2rem] leading-[1.06] font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
        Creator rate calculators
      </h1>
      <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-soft sm:text-lg">
        Every calculator uses the same transparent pricing model, pre-set for a platform, format, or deal term. Pick the
        one closest to the deal in front of you.
      </p>

      <div className="mt-12 grid gap-12">
        {GROUPS.map((group) => (
          <section key={group.title} aria-labelledby={`group-${group.title}`}>
            <h2 id={`group-${group.title}`} className="text-xl font-semibold tracking-tight sm:text-2xl">
              {group.title}
            </h2>
            <p className="mt-1 text-[15px] text-muted">{group.description}</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.slugs.map((slug) => {
                const page = getLinkTarget(slug);
                if (!page) return null;
                return (
                  <li key={slug}>
                    <Link
                      href={`/${slug}`}
                      className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-[border-color,box-shadow] hover:border-accent-line hover:shadow-card"
                    >
                      <span className="flex items-center justify-between gap-3 text-[16px] font-semibold text-ink">
                        {page.linkLabel}
                        <ArrowRight size={17} className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                      </span>
                      <span className="mt-1.5 text-[14px] leading-relaxed text-muted">{page.blurb}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-20">
        <CtaBand />
      </div>
    </div>
  );
}
