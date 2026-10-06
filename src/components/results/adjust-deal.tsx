"use client";

import { type ReactNode, useMemo } from "react";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Check, Minus, Plus, Restart } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { EXCLUSIVITY_IDS, PRODUCTION_IDS, TIMELINE_IDS, USAGE_DURATION_IDS, USAGE_TYPE_IDS } from "@/lib/pricing/catalog";
import { PRICING_CONFIG as CFG } from "@/lib/pricing/config";
import type { CalculatorDraft } from "@/lib/pricing/draft";
import { calculateRate } from "@/lib/pricing/engine";
import { formatMoney, formatSignedMoney } from "@/lib/pricing/format";
import type { DealInputs, RateResult } from "@/lib/pricing/types";
import { Card, CardHeader } from "./card";

export type AdjustField = "usage" | "usageDuration" | "exclusivity" | "deliverables" | "timeline" | "production";

interface AdjustDealProps {
  result: RateResult;
  originalAsk: number;
  onAdjust: (patch: Partial<CalculatorDraft>, field: AdjustField, via: "control" | "ladder" | "what_if") => void;
  onReset: () => void;
}

interface WhatIf {
  id: string;
  question: string;
  patch: Partial<DealInputs>;
  field: AdjustField;
}

function whatIfs(deal: DealInputs, isUgc: boolean): WhatIf[] {
  const list: WhatIf[] = [];
  if (deal.usage !== "none") {
    if (deal.usageDuration !== "30d") {
      list.push({ id: "usage-30", question: "What if they only want 30 days of usage?", patch: { usageDuration: "30d" }, field: "usageDuration" });
    }
    if (!isUgc) {
      list.push({ id: "usage-none", question: "What if they drop usage rights?", patch: { usage: "none" }, field: "usage" });
    }
  } else {
    list.push({
      id: "usage-paid-90",
      question: "What if they want 90 days of paid ads?",
      patch: { usage: "paid", usageDuration: "90d" },
      field: "usage",
    });
    list.push({
      id: "usage-paid-12",
      question: "What if they want 12 months of paid ads?",
      patch: { usage: "paid", usageDuration: "12m" },
      field: "usage",
    });
  }
  if (deal.exclusivity === "none") {
    list.push({ id: "excl-30", question: "What if they ask for 30 days of exclusivity?", patch: { exclusivity: "30d" }, field: "exclusivity" });
  } else {
    list.push({ id: "excl-none", question: "What if they drop exclusivity?", patch: { exclusivity: "none" }, field: "exclusivity" });
  }
  if (deal.timeline === "normal") {
    list.push({ id: "rush-3d", question: "What if they need it in 3 days?", patch: { timeline: "3d" }, field: "timeline" });
  }
  if (deal.deliverables === 1) {
    list.push({ id: "two-pieces", question: "What if they want a second piece?", patch: { deliverables: 2 }, field: "deliverables" });
  }
  return list.slice(0, 4);
}

function ControlRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 text-[14px] font-semibold text-ink">{label}</p>
      {children}
    </div>
  );
}

export function AdjustDeal({ result, originalAsk, onAdjust, onReset }: AdjustDealProps) {
  const { deal, isUgc } = result;
  const delta = result.ask - originalAsk;

  const ladder = useMemo(() => {
    const types = USAGE_TYPE_IDS.filter((id) => !(isUgc && id === "none"));
    const rows = types.map((id) => ({ id, ask: calculateRate({ ...deal, usage: id }).ask }));
    const max = Math.max(...rows.map((r) => r.ask));
    return rows.map((r) => ({ ...r, share: r.ask / max }));
  }, [deal, isUgc]);

  const suggestions = useMemo(
    () => whatIfs(deal, isUgc).map((w) => ({ ...w, ask: calculateRate({ ...deal, ...w.patch }).ask })),
    [deal, isUgc],
  );

  return (
    <Card id="adjust">
      <CardHeader
        title="What if the brand changes the deal?"
        subtitle="Change any term and your price updates instantly. More rights = more money."
      />

      <div className="sticky top-[72px] z-10 -mx-2 mb-5 flex items-center gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-card backdrop-blur sm:top-24">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium tracking-wide text-muted uppercase">Your ask</p>
          <p className="flex flex-wrap items-baseline gap-x-2 text-[22px] leading-tight font-semibold tracking-tight" aria-live="polite">
            {formatMoney(result.ask)}
            {delta !== 0 ? (
              <span className={cn("text-sm font-semibold", delta > 0 ? "text-positive" : "text-caution")}>
                {formatSignedMoney(delta)}
              </span>
            ) : null}
          </p>
        </div>
        <p className="hidden text-right text-[13px] text-muted min-[400px]:block">
          Range
          <br />
          <span className="font-medium text-ink-soft tabular-nums">
            {formatMoney(result.low)}–{formatMoney(result.high)}
          </span>
        </p>
        {delta !== 0 ? (
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset to your original deal"
            title="Reset to your original deal"
            className="flex size-10 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
          >
            <Restart size={17} />
          </button>
        ) : null}
      </div>

      {suggestions.length ? (
        <ul className="mb-7 grid gap-2 sm:grid-cols-2">
          {suggestions.map((s) => {
            const change = s.ask - result.ask;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onAdjust(s.patch, s.field, "what_if")}
                  className="flex h-full w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition-[border-color,box-shadow] hover:border-accent-line hover:shadow-card"
                >
                  <span className="flex-1 text-[14.5px] leading-snug font-medium text-ink">{s.question}</span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[15px] font-semibold tabular-nums">{formatMoney(s.ask)}</span>
                    <span className={cn("block text-[12px] font-semibold tabular-nums", change >= 0 ? "text-positive" : "text-caution")}>
                      {formatSignedMoney(change)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="grid gap-7">
        <ControlRow label="Usage rights">
          <div role="radiogroup" aria-label="Usage rights" className="grid gap-1.5">
            {ladder.map((row) => {
              const selected = row.id === deal.usage;
              return (
                <button
                  key={row.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onAdjust({ usage: row.id }, "usage", "ladder")}
                  className={cn(
                    "grid grid-cols-[minmax(0,7.5rem)_1fr_4.75rem] items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors sm:grid-cols-[10rem_1fr_5.5rem]",
                    selected ? "bg-accent-soft" : "hover:bg-subtle",
                  )}
                >
                  <span className={cn("flex items-center gap-1.5 text-[14px] leading-tight", selected ? "font-semibold text-ink" : "text-ink-soft")}>
                    {selected ? <Check size={14} strokeWidth={3} className="shrink-0 text-accent" /> : null}
                    {CFG.usageTypes[row.id].shortLabel}
                  </span>
                  <span className="h-2.5 w-full" aria-hidden="true">
                    <span
                      className={cn(
                        "block h-full rounded-r-[4px] transition-[width] duration-500 ease-[var(--ease-out-soft)]",
                        selected ? "bg-accent" : "bg-line-strong",
                      )}
                      style={{ width: `${Math.max(4, row.share * 100)}%` }}
                    />
                  </span>
                  <span className={cn("text-right text-[14px] tabular-nums", selected ? "font-semibold text-ink" : "text-ink-soft")}>
                    {formatMoney(row.ask)}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 px-3 text-[12.5px] text-muted">
            Starting ask for each option with{" "}
            {deal.usageDuration === "perpetual"
              ? "perpetual usage"
              : `${CFG.usageDurations[deal.usageDuration].label.toLowerCase()} of usage`}
            .
          </p>
        </ControlRow>

        {deal.usage !== "none" ? (
          <ControlRow label="Usage period">
            <ChoiceGroup
              label="Usage period"
              layout="chips"
              value={deal.usageDuration}
              options={USAGE_DURATION_IDS.map((id) => ({ value: id, label: CFG.usageDurations[id].label }))}
              onSelect={(usageDuration) => onAdjust({ usageDuration }, "usageDuration", "control")}
            />
          </ControlRow>
        ) : null}

        <ControlRow label="Exclusivity">
          <ChoiceGroup
            label="Exclusivity"
            layout="chips"
            value={deal.exclusivity}
            options={EXCLUSIVITY_IDS.map((id) => ({ value: id, label: CFG.exclusivity[id].label }))}
            onSelect={(exclusivity) => onAdjust({ exclusivity }, "exclusivity", "control")}
          />
        </ControlRow>

        <div className="grid gap-7 sm:grid-cols-[auto_1fr] sm:gap-10">
          <ControlRow label="Deliverables">
            <div className="flex h-11 w-fit items-center rounded-full border border-line-strong bg-surface">
              <button
                type="button"
                aria-label="Fewer deliverables"
                disabled={deal.deliverables <= 1}
                onClick={() => onAdjust({ deliverables: deal.deliverables - 1 }, "deliverables", "control")}
                className="flex size-11 items-center justify-center rounded-full text-ink-soft disabled:opacity-30"
              >
                <Minus size={18} />
              </button>
              <span className="min-w-8 text-center text-[15px] font-semibold tabular-nums">{deal.deliverables}</span>
              <button
                type="button"
                aria-label="More deliverables"
                disabled={deal.deliverables >= CFG.deliverables.max}
                onClick={() => onAdjust({ deliverables: deal.deliverables + 1 }, "deliverables", "control")}
                className="flex size-11 items-center justify-center rounded-full text-ink-soft disabled:opacity-30"
              >
                <Plus size={18} />
              </button>
            </div>
          </ControlRow>

          <ControlRow label="Timeline">
            <ChoiceGroup
              label="Timeline"
              layout="chips"
              value={deal.timeline}
              options={TIMELINE_IDS.map((id) => ({ value: id, label: CFG.timelines[id].label }))}
              onSelect={(timeline) => onAdjust({ timeline }, "timeline", "control")}
            />
          </ControlRow>
        </div>

        <ControlRow label="Production effort">
          <ChoiceGroup
            label="Production effort"
            layout="chips"
            value={deal.production}
            options={PRODUCTION_IDS.map((id) => ({ value: id, label: CFG.production[id].label }))}
            onSelect={(production) => onAdjust({ production }, "production", "control")}
          />
        </ControlRow>
      </div>
    </Card>
  );
}
