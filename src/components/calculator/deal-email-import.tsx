"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkle } from "@/components/ui/icons";
import { track } from "@/lib/analytics";
import { type ExtractedDealTerms, getDealExtractor } from "@/lib/deal-extraction";
import { getContentType, getPlatform } from "@/lib/pricing/catalog";
import { PRICING_CONFIG as CFG } from "@/lib/pricing/config";
import type { DraftPreset } from "@/lib/pricing/draft";

function describe(preset: DraftPreset): string[] {
  const found: string[] = [];
  if (preset.platform) {
    const content = getContentType(preset.platform, preset.contentType);
    const platform = getPlatform(preset.platform).label;
    found.push(content ? (content.label.includes(platform) ? content.label : `${platform} · ${content.label}`) : platform);
  }
  if (preset.deliverables && preset.deliverables > 1) found.push(`${preset.deliverables} deliverables`);
  if (preset.usage) {
    const duration = preset.usageDuration ? ` · ${CFG.usageDurations[preset.usageDuration].label}` : "";
    found.push(`${CFG.usageTypes[preset.usage].shortLabel}${duration}`);
  }
  if (preset.exclusivity && preset.exclusivity !== "none") found.push(`${CFG.exclusivity[preset.exclusivity].label} exclusivity`);
  if (preset.timeline && preset.timeline !== "normal") found.push(CFG.timelines[preset.timeline].label);
  return found;
}

/** "Paste the brand's email" — pre-fills the calculator. Behind FEATURES.dealEmailParser. */
export function DealEmailImport({ onApply }: { onApply: (preset: DraftPreset) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ExtractedDealTerms | null>(null);

  async function run() {
    setBusy(true);
    const extracted = await getDealExtractor().extract(text);
    setResult(extracted);
    setBusy(false);
    track("deal_email_parsed", { fields: Object.keys(extracted.preset).length, source: extracted.source });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-6 flex w-full items-center gap-3 rounded-2xl border border-dashed border-accent-line bg-accent-soft/40 px-4 py-3.5 text-left text-[15px] font-medium text-accent-ink transition-colors hover:bg-accent-soft"
      >
        <Sparkle size={18} />
        Have the brand&apos;s email? Paste it and we&apos;ll fill in the deal.
      </button>
    );
  }

  const found = result ? describe(result.preset) : [];
  return (
    <div className="mb-7 rounded-2xl border border-line bg-surface p-4 shadow-card animate-step-in">
      <label htmlFor="brand-email" className="text-[15px] font-semibold text-ink">
        Paste the brand&apos;s email or brief
      </label>
      <textarea
        id="brand-email"
        rows={5}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setResult(null);
        }}
        placeholder="We'd love to have you create one TikTok and give us 6 months of paid usage and 90 days of exclusivity…"
        className="mt-2.5 w-full resize-y rounded-xl border border-line-strong bg-surface p-3 text-[15px] text-ink outline-none placeholder:text-faint focus:border-accent"
      />
      <p className="mt-1.5 text-[12.5px] text-muted">Read in your browser — nothing is sent anywhere.</p>
      {result ? (
        found.length ? (
          <div className="mt-3 rounded-xl bg-subtle p-3 text-[14px] text-ink-soft">
            <p className="font-semibold text-ink">We found:</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {found.map((f) => (
                <li key={f} className="rounded-full bg-surface px-2.5 py-1 text-[13px]">
                  {f}
                </li>
              ))}
            </ul>
            {result.unpriced.length ? (
              <p className="mt-2 text-[13px] text-muted">Also mentioned (price separately): {result.unpriced.join(", ")}.</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-[14px] text-muted">We couldn&apos;t spot any deal terms — answer the questions below instead.</p>
        )
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {result && found.length ? (
          <Button variant="accent" onClick={() => onApply(result.preset)}>
            Use these answers
          </Button>
        ) : (
          <Button variant="primary" onClick={run} disabled={!text.trim() || busy}>
            {busy ? "Reading…" : "Fill in the deal"}
          </Button>
        )}
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
