import type { Metadata } from "next";
import { CalculatorLinks } from "@/components/marketing/calculator-links";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqList } from "@/components/marketing/faq-list";
import { FactorGrid, FlowVisual, Hero, ThreeQuestions, UsageExample } from "@/components/marketing/home-sections";
import { JsonLd } from "@/components/marketing/json-ld";
import { HOME_FAQS } from "@/lib/content/faqs";
import { SITE, absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="grid gap-24 sm:gap-32">
        <FlowVisual />
        <FactorGrid />
        <UsageExample />
        <ThreeQuestions />
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <FaqList faqs={HOME_FAQS} />
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <CalculatorLinks title="Calculators for every kind of deal" />
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <CtaBand />
        </div>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: SITE.name,
          url: absoluteUrl("/"),
          description: SITE.description,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
    </>
  );
}
