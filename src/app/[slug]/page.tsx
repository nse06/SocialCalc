import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calculator } from "@/components/calculator/calculator";
import { CalculatorLinks } from "@/components/marketing/calculator-links";
import { FaqList } from "@/components/marketing/faq-list";
import { JsonLd } from "@/components/marketing/json-ld";
import { UsageTable } from "@/components/marketing/usage-table";
import { ArrowRight } from "@/components/ui/icons";
import { LANDING_PAGES, getLandingPage } from "@/lib/content/landing-pages";
import { absoluteUrl } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return LANDING_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getLandingPage(slug);
  if (!page) return {};
  return {
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    alternates: { canonical: `/${page.slug}` },
    openGraph: { title: page.metaTitle, description: page.metaDescription, url: `/${page.slug}` },
    twitter: { title: page.metaTitle, description: page.metaDescription },
  };
}

const METHOD_STEPS = [
  "Expected reach: your typical views (or an estimate from followers) × a planning price per 1,000 views.",
  "Plus a content creation fee, so the work itself is always paid for.",
  "Adjusted for engagement, niche, audience location, and production effort.",
  "Plus deal terms: usage rights, exclusivity, extra deliverables, and rush delivery.",
];

export default async function LandingPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getLandingPage(slug);
  if (!page) notFound();

  return (
    <>
      <section className="relative isolate">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 h-[560px] bg-[radial-gradient(55%_50%_at_50%_0%,rgb(124_92_255/0.14),transparent)]"
        />
        <div className="mx-auto max-w-3xl px-4 pt-10 pb-8 text-center sm:px-6 sm:pt-16">
          <p className="text-[13px] font-semibold tracking-[0.08em] text-accent uppercase">{page.eyebrow}</p>
          <h1 className="mt-3 text-[2.2rem] leading-[1.06] font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
            {page.h1}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-soft text-pretty sm:text-lg">{page.intro}</p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <Calculator preset={page.preset} source={`landing:${page.slug}`} framed />
      </div>

      <div className="mx-auto mt-20 grid max-w-3xl gap-14 px-4 sm:mt-24 sm:px-6">
        <article className="grid gap-12">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{section.heading}</h2>
              {section.paragraphs?.map((p) => (
                <p key={p} className="mt-4 text-[16.5px] leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-5 grid gap-3">
                  {section.bullets.map((b) => (
                    <li key={b.text} className="flex gap-3 text-[16px] leading-relaxed text-ink-soft">
                      <span aria-hidden="true" className="mt-[0.65em] size-1.5 shrink-0 rounded-full bg-accent" />
                      <span>
                        {b.title ? <strong className="font-semibold text-ink">{b.title}: </strong> : null}
                        {b.text}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </article>

        {page.usageTable ? (
          <section>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              {page.usageTable === "whitelisting" ? "How this calculator prices whitelisting" : "How this calculator prices usage"}
            </h2>
            <UsageTable only={page.usageTable === "whitelisting" ? "whitelisting" : undefined} />
          </section>
        ) : null}

        <section className="rounded-[24px] border border-line bg-surface p-6 shadow-card sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight">How this calculator works</h2>
          <ol className="mt-4 grid gap-3">
            {METHOD_STEPS.map((step, i) => (
              <li key={step} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-5 text-[14px] leading-relaxed text-muted">
            It&apos;s a planning and negotiation tool, not a guaranteed market rate.{" "}
            <Link href="/methodology" className="inline-flex items-center gap-1 font-medium text-accent underline-offset-4 hover:underline">
              Read the full methodology <ArrowRight size={14} />
            </Link>
          </p>
        </section>

        <FaqList faqs={page.faqs} />
      </div>

      <div className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <CalculatorLinks slugs={page.related} title="Related calculators" />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: page.linkLabel, item: absoluteUrl(`/${page.slug}`) },
          ],
        }}
      />
    </>
  );
}
