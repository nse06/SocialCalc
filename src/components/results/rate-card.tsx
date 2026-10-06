"use client";

import { Pencil } from "@/components/ui/icons";
import { FEATURES } from "@/lib/features";
import { formatMoney, formatSignedMoney } from "@/lib/pricing/format";
import type { RateResult } from "@/lib/pricing/types";
import { SITE } from "@/lib/site";
import { AnimatedMoney } from "./animated-number";
import { CONFIDENCE_COPY, dealSummary } from "./helpers";

interface RateCardProps {
  result: RateResult;
  /** The ask from the creator's original answers, to show what adjustments changed. */
  originalAsk: number;
  animateFromZero: boolean;
  onEditAnswers: () => void;
}

const CONFIDENCE_DOTS: Record<RateResult["confidence"], number> = { good: 3, fair: 2, rough: 1 };

export function RateCard({ result, originalAsk, animateFromZero, onEditAnswers }: RateCardProps) {
  const rangeText = `${formatMoney(result.low)}–${formatMoney(result.high)}`;
  // Size the hero so the whole range fits on one line at any width.
  const heroSize = `min(4.5rem, calc(100cqw / ${(rangeText.length * 0.6).toFixed(2)}))`;
  const delta = result.ask - originalAsk;
  const confidence = CONFIDENCE_COPY[result.confidence];

  return (
    <section
      aria-labelledby="rate-heading"
      className="relative isolate overflow-hidden rounded-[28px] bg-night px-5 pt-6 pb-5 text-white shadow-lift sm:px-9 sm:pt-9 sm:pb-7"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-24 -z-10 size-[26rem] rounded-full bg-[radial-gradient(closest-side,rgb(124_92_255/0.55),transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-24 -z-10 size-[22rem] rounded-full bg-[radial-gradient(closest-side,rgb(56_189_248/0.18),transparent)]"
      />

      <div className="flex items-start justify-between gap-3">
        <h2 id="rate-heading" tabIndex={-1} data-step-heading className="text-[15px] font-medium text-night-muted outline-none">
          Your estimated rate
        </h2>
        <button
          type="button"
          onClick={onEditAnswers}
          className="-mt-1 -mr-2 inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-night-muted transition-colors hover:bg-white/10 hover:text-white"
        >
          <Pencil size={14} />
          Edit answers
        </button>
      </div>

      <div className="@container mt-2">
        <p
          className="font-semibold leading-[1.05] tracking-[-0.035em] whitespace-nowrap"
          style={{ fontSize: heroSize }}
          aria-label={`Estimated range ${formatMoney(result.low)} to ${formatMoney(result.high)}`}
        >
          <AnimatedMoney value={result.low} from={animateFromZero ? 0 : result.low} />
          <span className="text-night-muted">–</span>
          <AnimatedMoney value={result.high} from={animateFromZero ? 0 : result.high} />
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5">
        <p className="text-[15px] text-night-muted">Recommended starting ask</p>
        <p className="ml-auto text-[1.75rem] leading-none font-semibold tracking-tight" data-testid="recommended-ask">
          <AnimatedMoney value={result.ask} from={animateFromZero ? 0 : result.ask} />
        </p>
      </div>

      {delta !== 0 ? (
        <p className="mt-3 text-sm text-night-muted" aria-live="polite">
          <span className={delta > 0 ? "font-semibold text-[#7ee2b8]" : "font-semibold text-[#ffb18a]"}>
            {formatSignedMoney(delta)}
          </span>{" "}
          vs. your original deal ({formatMoney(originalAsk)})
        </p>
      ) : null}

      <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Deal summary">
        {dealSummary(result).map((chip) => (
          <li key={chip} className="rounded-full border border-white/12 px-2.5 py-1 text-[13px] text-[#d5d3e6]">
            {chip}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-[13px] text-night-muted" title={confidence.tip}>
          <span className="flex gap-0.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={i < CONFIDENCE_DOTS[result.confidence] ? "h-3 w-1.5 rounded-full bg-[#a28bff]" : "h-3 w-1.5 rounded-full bg-white/15"}
              />
            ))}
          </span>
          {confidence.label}
        </div>
        <p className="text-[12px] font-medium tracking-wide text-night-muted">{SITE.shortName}</p>
      </div>
      <p className="mt-3 text-[13px] leading-snug text-night-muted">
        This is a negotiation starting point, not a guaranteed market rate.
        {FEATURES.profileLookup && result.deal.platform === "youtube"
          ? " It's our independent estimate — not provided, approved, or endorsed by YouTube or Google."
          : null}
      </p>
    </section>
  );
}
