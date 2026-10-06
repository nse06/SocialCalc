"use client";

import { CopyButton } from "@/components/ui/copy-button";
import { track } from "@/lib/analytics";
import type { EmailTemplate } from "@/lib/content/email-templates";

export function TemplateCard({ template }: { template: EmailTemplate }) {
  return (
    <section id={template.id} className="scroll-mt-24 rounded-[24px] border border-line bg-surface p-5 shadow-card sm:p-7">
      <h2 className="text-xl font-semibold tracking-tight text-ink">{template.title}</h2>
      <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{template.when}</p>
      <div className="mt-4 rounded-2xl border border-line bg-canvas p-4 text-[15px] leading-relaxed whitespace-pre-wrap text-ink-soft sm:p-5">
        {template.body}
      </div>
      <CopyButton
        getText={() => template.body}
        variant="secondary"
        size="md"
        className="mt-4"
        onCopied={() => track("template_copied", { template: template.id })}
      >
        Copy template
      </CopyButton>
    </section>
  );
}
