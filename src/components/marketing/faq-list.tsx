import { Plus } from "@/components/ui/icons";
import type { Faq } from "@/lib/content/landing-pages";
import { JsonLd } from "./json-ld";

export function FaqList({ faqs, title = "Frequently asked questions" }: { faqs: Faq[]; title?: string }) {
  return (
    <section aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <div className="mt-6 divide-y divide-line rounded-[24px] border border-line bg-surface shadow-card">
        {faqs.map((faq) => (
          <details key={faq.q} className="group px-5 sm:px-6">
            <summary className="flex cursor-pointer list-none items-center gap-4 py-5 text-[16px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
              <span className="flex-1">{faq.q}</span>
              <Plus size={18} className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-45" />
            </summary>
            <p className="-mt-1 pb-5 text-[15px] leading-relaxed text-ink-soft">{faq.a}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }}
      />
    </section>
  );
}
