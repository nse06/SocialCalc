import { Lightbulb, Target } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/pricing/format";
import type { RateResult } from "@/lib/pricing/types";
import { Card, CardHeader } from "./card";

const POSITIONS = [
  { key: "ask", label: "Ask", note: "Open here", marker: "bg-accent" },
  { key: "target", label: "Comfortable target", note: "A good outcome", marker: "bg-ink" },
  { key: "floor", label: "Walk-away floor", note: "Below this, say no", marker: "bg-faint" },
] as const;

/** A number line: floor … [range] … with the ask and target marked. */
function RangeLine({ result }: { result: RateResult }) {
  const min = result.floor * 0.92;
  const max = result.high * 1.04;
  const pos = (v: number) => `${((v - min) / (max - min)) * 100}%`;
  return (
    <div className="relative mt-2 mb-7 h-12" aria-hidden="true">
      <div className="absolute top-1/2 right-0 left-0 h-[3px] -translate-y-1/2 rounded-full bg-line" />
      <div
        className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full bg-accent-soft ring-1 ring-accent-line"
        style={{ left: pos(result.low), width: `calc(${pos(result.high)} - ${pos(result.low)})` }}
      />
      {POSITIONS.map((p) => (
        <span
          key={p.key}
          className={cn("absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-[3px] ring-surface", p.marker)}
          style={{ left: pos(result[p.key]) }}
        />
      ))}
      <span className="absolute -bottom-1 -translate-x-1/2 text-[11px] text-faint tabular-nums" style={{ left: pos(result.low) }}>
        {formatMoney(result.low)}
      </span>
      <span className="absolute -bottom-1 -translate-x-1/2 text-[11px] text-faint tabular-nums" style={{ left: pos(result.high) }}>
        {formatMoney(result.high)}
      </span>
    </div>
  );
}

export function Strategy({ result }: { result: RateResult }) {
  return (
    <Card id="strategy">
      <CardHeader
        icon={<Target size={18} />}
        title="Your recommended strategy"
        subtitle="Start near the top of the range. Give yourself room to negotiate rather than opening at your minimum."
      />
      <RangeLine result={result} />
      <dl className="grid gap-2 sm:grid-cols-3 sm:gap-3">
        {POSITIONS.map((p) => (
          <div
            key={p.key}
            className={cn(
              "grid grid-cols-[1fr_auto] items-center gap-x-3 rounded-2xl border px-4 py-3 sm:grid-cols-1 sm:items-start",
              p.key === "ask" ? "border-accent-line bg-accent-soft/60" : "border-line",
            )}
          >
            <dt className="flex items-center gap-2 text-[13.5px] leading-tight font-semibold text-ink-soft">
              <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", p.marker)} />
              {p.label}
            </dt>
            <dd className="row-span-2 text-[1.4rem] leading-none font-semibold tracking-tight text-ink sm:row-span-1 sm:mt-2 sm:text-2xl">
              {formatMoney(result[p.key])}
            </dd>
            <dd className="mt-0.5 pl-4 text-[12.5px] text-muted sm:pl-0">{p.note}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 rounded-2xl bg-subtle p-4 sm:p-5">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
          <Lightbulb size={17} className="text-accent" />
          If they push back
        </p>
        <ul className="mt-3 grid gap-2.5 text-[14px] leading-relaxed text-ink-soft">
          <li>
            <strong className="font-semibold text-ink">Trade scope, not just price.</strong> Offer a shorter usage period, no
            exclusivity, or fewer deliverables before you drop your number.
          </li>
          <li>
            <strong className="font-semibold text-ink">Ask about their budget.</strong> A simple “What budget do you have for
            this?” often reveals room you didn&apos;t know about.
          </li>
          <li>
            <strong className="font-semibold text-ink">Get the terms in writing.</strong> Usage, exclusivity, deadlines, and
            payment timing should all be agreed before you start.
          </li>
        </ul>
      </div>
      <p className="mt-4 text-[12.5px] text-muted">General guidance to help you negotiate — not financial or legal advice.</p>
    </Card>
  );
}
