"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { ArrowRight, FileText, LinkIcon, Pencil, Restart } from "@/components/ui/icons";
import { priceBucket, track } from "@/lib/analytics";
import { FEATURES } from "@/lib/features";
import { type CalculatorDraft, draftToDeal } from "@/lib/pricing/draft";
import { calculateRate } from "@/lib/pricing/engine";
import { AdjustDeal, type AdjustField } from "./adjust-deal";
import { Breakdown } from "./breakdown";
import { EstimateNotes } from "./estimate-notes";
import { QuoteGenerator } from "./quote-generator";
import { RateCard } from "./rate-card";
import { RateComparison } from "./rate-comparison";
import { Strategy } from "./strategy";

interface ResultsProps {
  draft: CalculatorDraft;
  /** "flow" = just finished the calculator; "link" = opened a shared result. */
  origin: "flow" | "link";
  source: string;
  onChange: (patch: Partial<CalculatorDraft>) => void;
  onEditAnswers: () => void;
  onStartOver: () => void;
}

const ADJUSTABLE: AdjustField[] = ["usage", "usageDuration", "exclusivity", "deliverables", "timeline", "production"];

export function Results({ draft, origin, source, onChange, onEditAnswers, onStartOver }: ResultsProps) {
  const deal = useMemo(() => draftToDeal(draft), [draft]);
  const result = useMemo(() => (deal ? calculateRate(deal) : null), [deal]);

  // Snapshot of the deal as first answered, so adjustments can show their effect.
  const [original] = useState(() => ({ draft, ask: result?.ask ?? 0 }));
  const [quoteOpen, setQuoteOpen] = useState(false);
  const viewed = useRef(false);

  useEffect(() => {
    if (!result || viewed.current) return;
    viewed.current = true;
    track("result_viewed", {
      source,
      origin,
      platform: result.deal.platform,
      content_type: result.deal.contentType,
      price: priceBucket(result.ask),
      confidence: result.confidence,
      comparison: result.comparison?.status ?? "none",
    });
  }, [result, source, origin]);

  const adjust = useCallback(
    (patch: Partial<CalculatorDraft>, field: AdjustField, via: string) => {
      onChange(patch);
      track("result_adjusted", { field, via });
    },
    [onChange],
  );

  const reset = useCallback(() => {
    const patch: Partial<CalculatorDraft> = {};
    for (const field of ADJUSTABLE) {
      (patch as Record<string, unknown>)[field] = original.draft[field];
    }
    onChange(patch);
    track("result_adjusted", { field: "reset", via: "control" });
  }, [onChange, original]);

  const generateQuote = useCallback(() => {
    setQuoteOpen(true);
    track("quote_generated", { basis: "ask" });
    requestAnimationFrame(() => document.getElementById("quote")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  if (!result) {
    return (
      <div className="rounded-[24px] border border-line bg-surface p-6 text-center">
        <p className="text-[15px] text-ink-soft">This result link is missing a few answers.</p>
        <Button className="mt-4" onClick={onEditAnswers}>
          Finish the calculator
        </Button>
      </div>
    );
  }

  // A verdict on a rate the creator already gave belongs up top; an empty prompt doesn't.
  // Decided once, so the card never jumps away while someone is typing into it.
  const comparisonFirst = Boolean(original.draft.currentRate);
  const comparison = FEATURES.rateComparison ? (
    <RateComparison
      result={result}
      onCurrentRateChange={(currentRate) => {
        onChange({ currentRate });
        track("result_adjusted", { field: "current_rate", via: "control" });
      }}
    />
  ) : null;

  return (
    <div className="grid gap-4 sm:gap-5">
      <RateCard result={result} originalAsk={original.ask} animateFromZero={origin === "flow"} onEditAnswers={onEditAnswers} />

      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="accent" size="lg" className="px-4" onClick={generateQuote}>
          <FileText size={18} />
          {FEATURES.quoteGenerator ? "Generate my quote" : "See breakdown"}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="px-4"
          onClick={() => document.getElementById("adjust")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          Adjust the deal
        </Button>
      </div>

      {comparisonFirst ? comparison : null}

      <Breakdown result={result} />

      {FEATURES.dealAdjuster ? (
        <AdjustDeal result={result} originalAsk={original.ask} onAdjust={adjust} onReset={reset} />
      ) : null}

      <Strategy result={result} />

      {comparisonFirst ? null : comparison}

      {FEATURES.quoteGenerator ? <QuoteGenerator result={result} generated={quoteOpen} onGenerate={generateQuote} /> : null}

      <EstimateNotes result={result} />

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 pb-4">
        <Button variant="ghost" onClick={onEditAnswers}>
          <Pencil size={16} />
          Edit answers
        </Button>
        <Button variant="ghost" onClick={onStartOver}>
          <Restart size={16} />
          Start over
        </Button>
        {FEATURES.shareLink ? (
          <CopyButton
            variant="ghost"
            size="md"
            icon={<LinkIcon size={16} />}
            copiedLabel="Link copied"
            getText={() => window.location.href}
            onCopied={() => track("share_link_copied", { platform: result.deal.platform })}
          >
            Copy link to this result
          </CopyButton>
        ) : null}
      </div>
      <p className="text-center text-sm text-muted">
        Curious how this works?{" "}
        <Link href="/methodology" className="inline-flex items-center gap-1 font-medium text-accent underline-offset-4 hover:underline">
          Read the methodology <ArrowRight size={14} />
        </Link>
      </p>
    </div>
  );
}
