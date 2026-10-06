import { PRICING_CONFIG } from "./config";

/** The rounding step for a price of this size ($25 under $1K, $50 under $5K…). */
export function roundingStep(value: number): number {
  const abs = Math.abs(value);
  const rule = PRICING_CONFIG.rounding.find((r) => abs < r.below);
  return rule?.step ?? 1;
}

/** Rounds to a price a person would actually quote: 1037.42 → 1050. */
export function roundPrice(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const step = roundingStep(value);
  return Math.max(step, Math.round(value / step) * step);
}
