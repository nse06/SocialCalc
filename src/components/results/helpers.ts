import { PRICING_CONFIG as CFG } from "@/lib/pricing/config";
import { deliverableName } from "@/lib/pricing/catalog";
import { formatCompact } from "@/lib/pricing/format";
import type { RateResult } from "@/lib/pricing/types";

/** Rounds breakdown amounts so they read cleanly without pretending to be precise. */
export function roundForDisplay(value: number): number {
  const abs = Math.abs(value);
  const step = abs < 1_000 ? 5 : abs < 10_000 ? 10 : abs < 100_000 ? 100 : 1_000;
  return Math.round(value / step) * step;
}

/** Short chips describing the deal, e.g. ["Instagram Reel", "10K followers", "90-day paid usage"]. */
export function dealSummary(result: RateResult): string[] {
  const { deal, platform, content } = result;
  const chips: string[] = [];
  // "Sponsored Instagram Reel (high production)" → "Sponsored Instagram Reel"
  const name = content.custom ? deliverableName(content, deal.customLabel) : content.name.replace(/\s*\(.*\)$/, "");
  chips.push(deal.deliverables > 1 ? `${deal.deliverables} × ${name}` : name);
  if (!result.isUgc && deal.followers) chips.push(`${formatCompact(deal.followers)} ${platform.audienceNoun}`);
  if (deal.production !== "standard") chips.push(CFG.production[deal.production].label);
  chips.push(
    deal.usage === "none"
      ? "No usage rights"
      : `${CFG.usageDurations[deal.usageDuration].adjective} ${CFG.usageTypes[deal.usage].shortLabel.toLowerCase()}`,
  );
  const exclusivity = CFG.exclusivity[deal.exclusivity];
  if ("adjective" in exclusivity) chips.push(`${exclusivity.adjective} exclusivity`);
  if (deal.timeline !== "normal") chips.push(CFG.timelines[deal.timeline].label);
  return chips;
}

export const CONFIDENCE_COPY: Record<RateResult["confidence"], { label: string; tip: string }> = {
  good: { label: "Solid estimate", tip: "You gave us real performance numbers, so the range is fairly tight." },
  fair: { label: "Reasonable estimate", tip: "Add your typical views and engagement to tighten the range." },
  rough: { label: "Rough estimate", tip: "Some inputs were estimated or unusual, so the range is wider." },
};
