"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatMoney, formatSignedMoney, formatSignedPercent } from "@/lib/pricing/format";
import type { BreakdownLine, RateResult } from "@/lib/pricing/types";
import { roundForDisplay } from "./helpers";
import { Card, CardHeader } from "./card";

/** Categorical slots for the composition bar (validated: CVD + normal-vision gates pass on white). */
const SEGMENT_COLORS = {
  content: "#5b3df5",
  usage: "#eb6834",
  exclusivity: "#1baf7a",
  rush: "#eda100",
} as const;

type SegmentId = keyof typeof SEGMENT_COLORS;

function compositionSegments(result: RateResult) {
  const c = result.components;
  const raw: { id: SegmentId; label: string; value: number }[] = [
    { id: "content", label: result.isUgc ? "Content" : "Content & audience", value: c.content },
    { id: "usage", label: "Usage rights", value: c.usage },
    { id: "exclusivity", label: "Exclusivity", value: c.exclusivity },
    { id: "rush", label: "Rush", value: c.rush },
  ];
  const sum = raw.reduce((s, r) => s + r.value, 0);
  return raw.filter((r) => r.value > 0).map((r) => ({ ...r, share: r.value / sum }));
}

function CompositionBar({ result }: { result: RateResult }) {
  const segments = compositionSegments(result);
  const [active, setActive] = useState<SegmentId | null>(null);
  if (segments.length < 2) return null;
  const activeSegment = segments.find((s) => s.id === active);

  return (
    <figure className="mb-6">
      <figcaption className="mb-2.5 flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-ink-soft">Where your price comes from</span>
        <span className="text-muted" aria-live="polite">
          {activeSegment ? `${activeSegment.label}: ${Math.round(activeSegment.share * 100)}%` : " "}
        </span>
      </figcaption>
      <div className="flex h-6 w-full gap-[2px]" role="img" aria-label={segments.map((s) => `${s.label} ${Math.round(s.share * 100)}%`).join(", ")}>
        {segments.map((s, i) => (
          <div
            key={s.id}
            onMouseEnter={() => setActive(s.id)}
            onMouseLeave={() => setActive(null)}
            className={cn(
              "h-full min-w-[6px] transition-[flex-grow,opacity] duration-500 ease-[var(--ease-out-soft)]",
              i === 0 && "rounded-l-[4px]",
              i === segments.length - 1 && "rounded-r-[4px]",
              active && active !== s.id && "opacity-45",
            )}
            style={{ flexGrow: s.share, flexBasis: 0, backgroundColor: SEGMENT_COLORS[s.id] }}
          />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:flex sm:flex-wrap sm:gap-x-5">
        {segments.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-2 text-[13px] text-ink-soft"
            onMouseEnter={() => setActive(s.id)}
            onMouseLeave={() => setActive(null)}
          >
            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: SEGMENT_COLORS[s.id] }} />
            <span>{s.label}</span>
            <span className="ml-auto font-medium text-ink tabular-nums sm:ml-0">{Math.round(s.share * 100)}%</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function LineAmount({ line }: { line: BreakdownLine }) {
  const amount = roundForDisplay(line.amount);
  if (line.kind === "base") {
    return <span className="font-semibold text-ink tabular-nums">{formatMoney(amount)}</span>;
  }
  return (
    <span className={cn("font-semibold tabular-nums", line.active ? "text-ink" : "text-muted")}>
      {formatSignedMoney(amount)}
    </span>
  );
}

function PercentChip({ line }: { line: BreakdownLine }) {
  if (line.kind !== "adjustment" || line.percent === undefined) return null;
  const pct = Math.round(line.percent * 100);
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums",
        pct > 0 && "bg-positive-soft text-positive",
        pct < 0 && "bg-caution-soft text-caution",
        pct === 0 && "bg-subtle text-muted",
      )}
    >
      {pct === 0 ? "Baseline" : formatSignedPercent(line.percent)}
    </span>
  );
}

const GROUPS: { kind: BreakdownLine["kind"]; title: string }[] = [
  { kind: "base", title: "Starting point" },
  { kind: "adjustment", title: "Adjustments" },
  { kind: "fee", title: "Deal terms" },
];

export function Breakdown({ result }: { result: RateResult }) {
  return (
    <Card id="breakdown">
      <CardHeader
        title="What's driving your rate?"
        subtitle="Your price is built from expected reach, the work involved, and what the brand gets to do with it."
      />
      <CompositionBar result={result} />
      <div className="grid gap-5">
        {GROUPS.map((group) => {
          const lines = result.lines.filter((l) => l.kind === group.kind);
          if (!lines.length) return null;
          return (
            <div key={group.kind}>
              <h3 className="mb-1 text-[12px] font-semibold tracking-[0.08em] text-muted uppercase">{group.title}</h3>
              <ul className="divide-y divide-line">
                {lines.map((line) => (
                  <li key={line.id} className="flex items-start gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("text-[15px] font-semibold", line.active || line.kind === "base" ? "text-ink" : "text-muted")}>
                          {line.label}
                        </span>
                        <PercentChip line={line} />
                      </div>
                      <p className="mt-0.5 text-[13.5px] leading-snug text-muted">{line.detail}</p>
                    </div>
                    <div className="pt-0.5 text-[15px]">
                      <LineAmount line={line} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-subtle px-4 py-3.5">
        <div>
          <p className="text-[15px] font-semibold text-ink">Fair value</p>
          <p className="text-[13px] text-muted">The middle of your range, before negotiation</p>
        </div>
        <p className="text-lg font-semibold whitespace-nowrap tabular-nums">≈ {formatMoney(result.fairValue)}</p>
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-muted">
        Every number here is a planning assumption you can question.{" "}
        <Link href="/methodology" className="font-medium text-accent underline-offset-4 hover:underline">
          See how we calculate it
        </Link>
        .
      </p>
    </Card>
  );
}
