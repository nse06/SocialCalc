"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import { TrendingUp } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/pricing/format";
import type { RateResult } from "@/lib/pricing/types";

interface RateComparisonProps {
  result: RateResult;
  onCurrentRateChange: (value: number | null) => void;
}

function multipleText(multiple: number): string {
  if (multiple >= 1.95) return `${Number(multiple.toFixed(1))}×`;
  return `${Math.round((multiple - 1) * 100)}% more than`;
}

/** Optional, non-judgmental comparison with what the creator charges today. */
export function RateComparison({ result, onCurrentRateChange }: RateComparisonProps) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<number | null>(result.deal.currentRate ?? null);
  const comparison = result.comparison;
  const range = `${formatMoney(result.low)}–${formatMoney(result.high)}`;

  const commit = () => {
    onCurrentRateChange(pending && pending > 0 ? pending : null);
    setEditing(false);
  };

  if (!comparison || editing) {
    return (
      <div className="rounded-[24px] border border-dashed border-line-strong bg-surface/60 p-5 sm:p-6">
        <p className="mb-3 text-[15px] font-semibold text-ink">How does this compare with what you charge now?</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full max-w-[14rem]">
            <NumberField
              mode="money"
              size="md"
              label={<span className="text-sm font-medium text-ink-soft">Your current rate for this</span>}
              placeholder="e.g. 400"
              value={pending}
              onValueChange={setPending}
              onEnter={commit}
            />
          </div>
          <Button variant="secondary" size="md" className="h-12" onClick={commit} disabled={!editing && !pending}>
            {editing && !pending ? "Remove" : "Compare"}
          </Button>
        </div>
        <p className="mt-2.5 text-[13px] text-muted">Optional. It never leaves your device.</p>
      </div>
    );
  }

  const { status, currentRate, askMultiple } = comparison;
  const undercharging = status === "well-below" || status === "below";

  const copy = {
    "well-below": {
      title: "You may be undercharging.",
      body: `You currently charge ${formatMoney(currentRate)}. Based on the deal terms you entered, a reasonable starting range is ${range}.`,
      extra: `Your recommended ask is ${multipleText(askMultiple)} what you charge now. That's common — most creators set their first rate long before they knew what their content was worth.`,
    },
    below: {
      title: "You may be undercharging.",
      body: `You currently charge ${formatMoney(currentRate)}. Based on the deal terms you entered, a reasonable starting range is ${range}.`,
      extra: "You're close. Try quoting the recommended ask to the next brand that reaches out.",
    },
    within: {
      title: "Your current rate is in range.",
      body: `You charge ${formatMoney(currentRate)}, which sits inside the estimated range of ${range}.`,
      extra: "If brands accept instantly, that's a sign you can nudge it up.",
    },
    above: {
      title: "You're charging above this estimate.",
      body: `You charge ${formatMoney(currentRate)}; this estimate suggests ${range}.`,
      extra: "That can be completely fine — strong results, a great portfolio, or high demand all justify it. If brands keep saying yes, keep it.",
    },
  }[status];

  return (
    <section
      aria-live="polite"
      className={cn(
        "rounded-[24px] border p-5 sm:p-6",
        undercharging ? "border-caution-line bg-caution-soft" : "border-line bg-surface",
      )}
    >
      <div className="flex items-start gap-3.5">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            undercharging ? "bg-white text-caution" : "bg-accent-soft text-accent",
          )}
        >
          <TrendingUp size={20} />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-ink">{copy.title}</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{copy.body}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">{copy.extra}</p>
          <button
            type="button"
            onClick={() => {
              setPending(currentRate);
              setEditing(true);
            }}
            className="mt-3 text-sm font-medium text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink"
          >
            Change your current rate
          </button>
        </div>
      </div>
    </section>
  );
}
