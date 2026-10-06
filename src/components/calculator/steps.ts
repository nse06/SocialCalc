/**
 * Calculator flow: which questions to ask, in what order, and when each is
 * answered. Steps that don't apply (e.g. audience questions for UGC) are
 * skipped automatically.
 */
import { getContentType, getPlatform, getSizeTier } from "@/lib/pricing/catalog";
import { PRICING_CONFIG } from "@/lib/pricing/config";
import { type CalculatorDraft, isUgcDraft } from "@/lib/pricing/draft";
import { engagementBenchmark, estimateViews } from "@/lib/pricing/engine";
import { formatNumber, roughly } from "@/lib/pricing/format";

export type StepId =
  | "platform"
  | "content"
  | "effort"
  | "audience"
  | "engagement"
  | "niche"
  | "location"
  | "usage"
  | "terms";

interface StepDef {
  id: StepId;
  applies: (d: CalculatorDraft) => boolean;
  isComplete: (d: CalculatorDraft) => boolean;
}

const always = () => true;
const notUgc = (d: CalculatorDraft) => !isUgcDraft(d);

export const STEPS: StepDef[] = [
  { id: "platform", applies: always, isComplete: (d) => Boolean(d.platform) },
  {
    id: "content",
    applies: always,
    isComplete: (d) => Boolean(d.platform && getContentType(d.platform, d.contentType)),
  },
  { id: "effort", applies: always, isComplete: (d) => Boolean(d.production) },
  {
    id: "audience",
    applies: notUgc,
    isComplete: (d) => !followersError(d.followers) && (d.viewsUnknown || !viewsError(d.views)),
  },
  {
    id: "engagement",
    applies: notUgc,
    isComplete: (d) => d.engagementSkipped || !engagementError(d.engagementRate),
  },
  { id: "niche", applies: always, isComplete: (d) => Boolean(d.niche) },
  { id: "location", applies: notUgc, isComplete: (d) => Boolean(d.location) },
  {
    id: "usage",
    applies: always,
    isComplete: (d) => Boolean(d.usage) && !(isUgcDraft(d) && d.usage === "none"),
  },
  { id: "terms", applies: always, isComplete: (d) => !currentRateError(d.currentRate) },
];

export function applicableSteps(d: CalculatorDraft): StepId[] {
  return STEPS.filter((s) => s.applies(d)).map((s) => s.id);
}

export function isStepComplete(d: CalculatorDraft, id: StepId): boolean {
  return STEPS.find((s) => s.id === id)?.isComplete(d) ?? false;
}

/** The first applicable step that still needs an answer, or null if all are done. */
export function firstIncompleteStep(d: CalculatorDraft): StepId | null {
  return STEPS.find((s) => s.applies(d) && !s.isComplete(d))?.id ?? null;
}

export function nextStep(d: CalculatorDraft, current: StepId): StepId | null {
  const steps = applicableSteps(d);
  const index = steps.indexOf(current);
  return index === -1 ? (steps[0] ?? null) : (steps[index + 1] ?? null);
}

export function previousStep(d: CalculatorDraft, current: StepId): StepId | null {
  const steps = applicableSteps(d);
  const index = steps.indexOf(current);
  return index > 0 ? steps[index - 1] : null;
}

/** `target` if it applies to this draft, otherwise the closest applicable step before it. */
export function nearestApplicableStep(d: CalculatorDraft, target: StepId): StepId {
  const applicable = applicableSteps(d);
  if (applicable.includes(target)) return target;
  const order = STEPS.map((s) => s.id);
  for (let i = order.indexOf(target) - 1; i >= 0; i--) {
    if (applicable.includes(order[i])) return order[i];
  }
  return applicable[0] ?? "platform";
}

export function isStepId(value: unknown): value is StepId {
  return typeof value === "string" && STEPS.some((s) => s.id === value);
}

// ---------------------------------------------------------------------------
// Validation messages (errors block progress; warnings just inform)
// ---------------------------------------------------------------------------

const { limits, reliability } = PRICING_CONFIG;

export function followersError(n: number | null): string | null {
  if (n === null) return "Enter your follower count — a rough number is fine.";
  if (!(n >= 1)) return "Enter a number above 0.";
  if (n > limits.maxFollowers) return "That's over 1 billion — double-check the number.";
  return null;
}

export function viewsError(n: number | null): string | null {
  if (n === null) return "Enter your typical views, or let us estimate them.";
  if (!(n >= 1)) return "Enter a number above 0 — or let us estimate it.";
  if (n > limits.maxViews) return "That's more views than we can work with — double-check the number.";
  return null;
}

export function viewsWarning(views: number | null, followers: number | null): string | null {
  if (!views || !followers) return null;
  if (views > followers * reliability.viewsHighMultipleOfFollowers) {
    return "That's well above your follower count. Use your typical recent performance, not a viral hit.";
  }
  return null;
}

export function engagementError(n: number | null): string | null {
  if (n === null) return "Enter a percentage, use the helper, or skip this step.";
  if (!(n > 0)) return "Enter a percentage above 0.";
  if (n > limits.maxEngagementPercent) return "Engagement rate can't be more than 100%.";
  return null;
}

export function engagementWarning(d: CalculatorDraft): string | null {
  const rate = d.engagementRate;
  if (!rate || !d.platform || rate > limits.maxEngagementPercent) return null;
  const benchmark = engagementBenchmark(d.platform, d.followers);
  if (rate > reliability.engagementUnusualPercent || rate / benchmark > reliability.engagementUnusualRatio) {
    return `That's unusually high for ${getPlatform(d.platform).label} (typical is around ${Number(benchmark.toFixed(1))}%). Double-check with the helper below — if it's right, great!`;
  }
  if (rate < 0.1) return "That's very low — double-check the decimal point.";
  return null;
}

export function currentRateError(n: number | null): string | null {
  if (n === null) return null;
  if (!(n > 0)) return "Enter an amount above $0, or leave it blank.";
  if (n > limits.maxCurrentRate) return "That's a very large number — double-check it.";
  return null;
}

/** "We'd estimate about 3,000 views" helper text for the audience step. */
export function viewsEstimateText(d: CalculatorDraft): string | null {
  if (!d.platform || !d.contentType || !d.followers || followersError(d.followers)) return null;
  const views = estimateViews(d.platform, d.contentType, d.followers);
  if (!views) return null;
  const content = getContentType(d.platform, d.contentType);
  const noun = content?.viewsNoun ?? "views";
  const size = getSizeTier(d.followers).label;
  return `We'll assume about ${formatNumber(roughly(views))} ${noun} — a typical share for ${size[0].toLowerCase()}${size.slice(1)} accounts.`;
}
