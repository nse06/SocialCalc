import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/ads/ad-slot";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { CalculatorLinks } from "@/components/marketing/calculator-links";
import { FaqList } from "@/components/marketing/faq-list";
import { TemplateCard } from "@/components/marketing/template-card";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRight } from "@/components/ui/icons";
import { EMAIL_TEMPLATES } from "@/lib/content/email-templates";

export const metadata: Metadata = {
  title: { absolute: "Brand Deal Email Templates: How to Reply to Brands (Copy & Paste)" },
  description:
    "Copy-ready replies for brand deals: quote your rate, ask for their budget, counter a low offer, add usage or whitelisting fees, and decline politely.",
  alternates: { canonical: "/brand-deal-email-templates" },
};

const FAQS = [
  {
    q: "Should I put my rate in the first reply?",
    a: "If the brand gave you clear deliverables and terms, yes — a confident, specific number saves a round of emails. If the request is vague, ask clarifying questions and their budget first.",
  },
  {
    q: "How do I answer “what are your rates?” without underselling?",
    a: "Price the specific deal, not a generic post. Deliverables, usage rights, exclusivity, and timing all change what's fair. The calculator turns those into a number and an itemized quote you can paste into the first template.",
  },
  {
    q: "Is it unprofessional to negotiate?",
    a: "No. Brands expect it. Keep it friendly and specific, and offer to adjust scope — fewer deliverables, shorter usage — rather than simply dropping your price.",
  },
];

export default function EmailTemplatesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
      <Breadcrumbs items={[{ name: "Brand deal email templates", href: "/brand-deal-email-templates" }]} />
      <p className="mt-6 text-[13px] font-semibold tracking-[0.08em] text-accent uppercase">Templates</p>
      <h1 className="mt-3 text-[2.2rem] leading-[1.06] font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
        Brand deal email templates
      </h1>
      <p className="mt-5 text-[17px] leading-relaxed text-ink-soft sm:text-lg">
        Friendly, professional replies for the moments that matter: quoting your rate, asking about budget, countering a
        low offer, and adding usage fees. Copy one, fill in the brackets, and send.
      </p>

      <div className="mt-8 flex flex-col gap-4 rounded-[24px] bg-night p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <p className="text-lg font-semibold">Know your number first</p>
          <p className="mt-1 text-[14.5px] text-night-muted">Get a fair rate and an itemized quote to paste into your reply.</p>
        </div>
        <ButtonLink href="/calculator" variant="accent" size="md" className="shrink-0">
          Calculate my rate
          <ArrowRight size={17} />
        </ButtonLink>
      </div>

      <nav aria-label="Templates" className="mt-10">
        <ul className="flex flex-wrap gap-2">
          {EMAIL_TEMPLATES.map((t) => (
            <li key={t.id}>
              <Link
                href={`#${t.id}`}
                className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-3.5 text-[14px] text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
              >
                {t.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 grid gap-5">
        {EMAIL_TEMPLATES.slice(0, 4).map((t) => (
          <TemplateCard key={t.id} template={t} />
        ))}
        <AdSlot placement="landingArticle" />
        {EMAIL_TEMPLATES.slice(4).map((t) => (
          <TemplateCard key={t.id} template={t} />
        ))}
      </div>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">Before you hit send</h2>
        <ul className="mt-5 grid gap-3 text-[16px] leading-relaxed text-ink-soft">
          {[
            "Name the exact deliverables and platforms, so there's no surprise scope later.",
            "Put a time limit on any usage rights and exclusivity.",
            "Confirm the posting window, review rounds, and payment timing.",
            "Keep the tone warm and short — brands read a lot of emails.",
          ].map((tip) => (
            <li key={tip} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.65em] size-1.5 shrink-0 rounded-full bg-accent" />
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-14">
        <FaqList faqs={FAQS} />
      </div>

      <div className="mt-16">
        <CalculatorLinks
          slugs={["brand-deal-calculator", "usage-rights-calculator", "exclusivity-fee-calculator"]}
          title="Price the deal first"
        />
      </div>
    </div>
  );
}
