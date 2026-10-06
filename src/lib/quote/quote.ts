/**
 * Turns a RateResult into an itemized quote and a short brand reply.
 * Line items always add up exactly to the quoted total.
 */
import { PRICING_CONFIG as CFG } from "@/lib/pricing/config";
import { deliverableName } from "@/lib/pricing/catalog";
import { capitalize, formatMoney, joinList, numberWord } from "@/lib/pricing/format";
import type { RateResult } from "@/lib/pricing/types";

export type QuoteBasis = "ask" | "target" | "custom";

export interface QuoteLine {
  id: "content" | "usage" | "exclusivity" | "rush";
  label: string;
  amount: number;
}

export interface Quote {
  basis: QuoteBasis;
  lines: QuoteLine[];
  total: number;
}

/** Granularity for line items, so they read like real prices. */
function lineStep(total: number): number {
  if (total < 100) return 5;
  if (total < 5_000) return 25;
  if (total < 20_000) return 50;
  if (total < 50_000) return 100;
  return 500;
}

export function contentLineLabel(result: RateResult): string {
  const { deal, content } = result;
  const name = deliverableName(content, deal.customLabel);
  const production =
    deal.production === "high" || deal.production === "very-high"
      ? ` (${CFG.production[deal.production].label.toLowerCase()})`
      : "";
  return deal.deliverables > 1 ? `${deal.deliverables} × ${name}${production}` : `${name}${production}`;
}

export function usageLineLabel(result: RateResult): string | null {
  const { usage, usageDuration } = result.deal;
  if (usage === "none") return null;
  const rights = CFG.usageTypes[usage].rights;
  return `${CFG.usageDurations[usageDuration].adjective} ${rights}`;
}

export function exclusivityLineLabel(result: RateResult): string | null {
  const ex = CFG.exclusivity[result.deal.exclusivity];
  if (!("adjective" in ex)) return null;
  return `${ex.adjective} category exclusivity`;
}

export function rushLineLabel(result: RateResult): string | null {
  const t = CFG.timelines[result.deal.timeline];
  if (!t.fee) return null;
  return `Rush fee (${t.phrase})`;
}

export function resolveQuoteTotal(result: RateResult, basis: QuoteBasis, customTotal?: number | null): number {
  if (basis === "custom" && customTotal && Number.isFinite(customTotal) && customTotal > 0) {
    return Math.round(customTotal);
  }
  return basis === "target" ? result.target : result.ask;
}

export function buildQuote(result: RateResult, basis: QuoteBasis = "ask", customTotal?: number | null): Quote {
  const total = resolveQuoteTotal(result, basis, customTotal);
  const c = result.components;
  const parts: { id: QuoteLine["id"]; label: string | null; value: number }[] = [
    { id: "usage", label: usageLineLabel(result), value: c.usage },
    { id: "exclusivity", label: exclusivityLineLabel(result), value: c.exclusivity },
    { id: "rush", label: rushLineLabel(result), value: c.rush },
  ];
  const items = [
    { id: "content" as const, label: contentLineLabel(result), value: c.content },
    ...parts
      .filter((p): p is typeof p & { label: string } => Boolean(p.label) && p.value > 0)
      .map((p) => ({ ...p, label: capitalize(p.label) })),
  ];
  const rawSum = items.reduce((sum, i) => sum + i.value, 0);

  return { basis, total, lines: allocate(total, items, rawSum) };
}

/**
 * Splits `total` across items in proportion to their model values, in whole
 * price steps (largest-remainder method, ties go to the main deliverable).
 * Any remainder that isn't a whole step (custom totals) goes to the deliverable.
 */
function allocate(
  total: number,
  items: { id: QuoteLine["id"]; label: string; value: number }[],
  rawSum: number,
): QuoteLine[] {
  if (items.length === 1 || rawSum <= 0) {
    return [{ id: items[0].id, label: items[0].label, amount: total }];
  }
  const step = lineStep(total);
  const units = Math.floor(total / step);
  const exact = items.map((i) => (units * i.value) / rawSum);
  const alloc = exact.map((x) => Math.floor(x));
  let remaining = units - alloc.reduce((a, b) => a + b, 0);
  const order = exact
    .map((x, index) => ({ index, remainder: x - Math.floor(x) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of order) {
    if (remaining <= 0) break;
    alloc[index]++;
    remaining--;
  }
  // Every add-on the brand asked for gets at least one step, taken from the deliverable.
  for (let i = 1; i < alloc.length; i++) {
    if (alloc[i] === 0 && alloc[0] > 1) {
      alloc[i] = 1;
      alloc[0]--;
    }
  }
  const lines = items.map((item, i) => ({ id: item.id, label: item.label, amount: alloc[i] * step }));
  lines[0].amount += total - units * step;

  if (lines.some((l) => l.amount <= 0)) {
    // Tiny custom totals: exact proportional split in whole dollars.
    let assigned = 0;
    for (let i = 1; i < lines.length; i++) {
      lines[i].amount = Math.floor((total * items[i].value) / rawSum);
      assigned += lines[i].amount;
    }
    lines[0].amount = total - assigned;
  }
  return lines;
}

/** Plain text that pastes cleanly into email, DMs, or a notes app. */
export function formatQuoteText(quote: Quote): string {
  const lines = quote.lines.map((l) => `${l.label} — ${formatMoney(l.amount)}`);
  return [...lines, `Total — ${formatMoney(quote.total)}`].join("\n");
}

function deliverablePhrase(result: RateResult): string {
  const { deal, content } = result;
  const n = deal.deliverables;
  const custom = content.custom ? deal.customLabel?.trim() : "";
  if (custom) return n > 1 ? `${numberWord(n)} × ${custom}` : custom;
  return `${numberWord(n)} ${n === 1 ? content.noun.one : content.noun.many}`;
}

function usagePhrase(result: RateResult): string | null {
  const { usage, usageDuration } = result.deal;
  if (usage === "none") return null;
  const kind: Record<Exclude<typeof usage, "none">, string> = {
    organic: "organic usage",
    paid: "paid usage",
    whitelisting: "whitelisting / partnership ads",
    buyout: "full buyout usage",
  };
  if (usageDuration === "perpetual") return `perpetual ${kind[usage]}`;
  return `${CFG.usageDurations[usageDuration].label} of ${kind[usage]}`;
}

function exclusivityPhrase(result: RateResult): string | null {
  const ex = CFG.exclusivity[result.deal.exclusivity];
  if (!("phrase" in ex)) return null;
  return `${ex.phrase} of category exclusivity`;
}

export interface ReplyOptions {
  brandName?: string;
  creatorName?: string;
}

/** A concise, friendly reply a creator can paste back to the brand. */
export function buildBrandReply(result: RateResult, quote: Quote, options: ReplyOptions = {}): string {
  const brand = options.brandName?.trim();
  const name = options.creatorName?.trim();
  const timeline = CFG.timelines[result.deal.timeline];

  const includes = [deliverablePhrase(result), usagePhrase(result), exclusivityPhrase(result)].filter(
    (x): x is string => Boolean(x),
  );
  if (timeline.fee > 0) includes.push(timeline.phrase);

  const hasTerms = result.deal.usage !== "none" || result.deal.exclusivity !== "none";
  const paragraphs = [
    brand ? `Hi ${brand} team,` : "Hi there,",
    `Thanks for reaching out! Based on the ${hasTerms ? "deliverables and usage terms" : "deliverables"} outlined, my rate for this collaboration would be ${formatMoney(
      quote.total,
    )}. This includes ${joinList(includes)}.`,
  ];

  if (result.deal.usage === "none" && !result.isUgc) {
    paragraphs.push(
      "This covers posting on my channel. If you'd like to reuse the content in ads or on your own channels, I'm happy to quote usage rights separately.",
    );
  } else {
    paragraphs.push(
      "If that's different from the budget you had in mind, I'm happy to talk through options — like adjusting the usage period or deliverables.",
    );
  }

  paragraphs.push(name ? `Looking forward to it!\n${name}` : "Looking forward to it!");
  return paragraphs.join("\n\n");
}
