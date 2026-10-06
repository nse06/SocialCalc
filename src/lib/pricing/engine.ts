/**
 * The pricing engine: pure, deterministic, dependency-free.
 *
 *   audience value  = expected views ÷ 1,000 × planning CPM
 *   base            = audience value + content creation fee
 *   per piece       = base × engagement × location × niche × production
 *   content fee     = per piece × deliverables (extra pieces discounted)
 *   total           = content fee + usage fee + exclusivity fee + rush fee
 *
 * Fees are shares of the content fee. The total becomes a low/high range
 * (wider when we had to estimate) plus negotiation positions, all rounded to
 * prices a person would actually quote.
 */
import { PRICING_CONFIG as CFG } from "./config";
import {
  EXCLUSIVITY_IDS,
  LOCATION_IDS,
  NICHE_IDS,
  PLATFORM_IDS,
  PRODUCTION_IDS,
  TIMELINE_IDS,
  USAGE_DURATION_IDS,
  USAGE_TYPE_IDS,
  getContentType,
  getContentTypes,
  getNiche,
  getPlatform,
  getSizeTier,
  isOneOf,
  usageFeeShare,
} from "./catalog";
import { formatCompact, formatNumber, formatPercent, roughly } from "./format";
import { roundPrice, roundingStep } from "./rounding";
import type {
  BreakdownLine,
  ComparisonStatus,
  Confidence,
  ContentTypeConfig,
  DealInputs,
  PlatformConfig,
  PlatformId,
  RateResult,
  ReliabilityNote,
} from "./types";

const pct = (fraction: number) => `${Math.round(fraction * 100)}%`;

function positiveOrNull(value: number | null | undefined, max: number): number | null {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) return null;
  return Math.min(value, max);
}

/**
 * Makes any input safe to price: unknown ids fall back to sensible defaults,
 * numbers are clamped. The engine never throws on bad input.
 */
export function sanitizeDeal(input: DealInputs): DealInputs {
  const platform: PlatformId = isOneOf(PLATFORM_IDS, input.platform) ? input.platform : "instagram";
  const content = getContentType(platform, input.contentType) ?? getContentTypes(platform)[0];
  const { limits, deliverables } = CFG;
  const followers = positiveOrNull(input.followers, limits.maxFollowers);
  const views = positiveOrNull(input.views, limits.maxViews);
  const engagementRate = positiveOrNull(input.engagementRate, limits.maxEngagementPercent);
  const currentRate = positiveOrNull(input.currentRate, limits.maxCurrentRate);
  const count = Number.isFinite(input.deliverables) ? Math.round(input.deliverables) : 1;

  return {
    platform,
    contentType: content.id,
    customLabel: input.customLabel?.trim().slice(0, limits.maxCustomLabelLength) || undefined,
    production: isOneOf(PRODUCTION_IDS, input.production) ? input.production : "standard",
    followers: followers === null ? null : Math.round(followers),
    views: views === null ? null : Math.round(views),
    engagementRate,
    niche: isOneOf(NICHE_IDS, input.niche) ? input.niche : "general",
    location: isOneOf(LOCATION_IDS, input.location) ? input.location : "us-ca",
    usage: isOneOf(USAGE_TYPE_IDS, input.usage) ? input.usage : "none",
    usageDuration: isOneOf(USAGE_DURATION_IDS, input.usageDuration) ? input.usageDuration : "90d",
    exclusivity: isOneOf(EXCLUSIVITY_IDS, input.exclusivity) ? input.exclusivity : "none",
    deliverables: Math.min(Math.max(count, 1), deliverables.max),
    timeline: isOneOf(TIMELINE_IDS, input.timeline) ? input.timeline : "normal",
    currentRate: currentRate === null ? null : Math.round(currentRate),
  };
}

export function viewsNoun(content: ContentTypeConfig): string {
  return content.viewsNoun ?? "views";
}

/** Default expected views when the creator doesn't know theirs. */
export function estimateViews(platform: PlatformId, contentTypeId: string, followers: number | null): number {
  const content = getContentType(platform, contentTypeId);
  if (!content || content.ugc || !followers || followers <= 0) return 0;
  const tier = getSizeTier(followers);
  return Math.max(1, Math.round(followers * content.reachRate * tier.reachFactor));
}

/** The "typical" engagement rate we compare against, in percent. */
export function engagementBenchmark(platform: PlatformId, followers: number | null): number {
  const { basis, benchmark } = getPlatform(platform).engagement;
  if (basis === "followers" && followers && followers > 0) {
    return benchmark * getSizeTier(followers).engagementBenchmarkFactor;
  }
  return benchmark;
}

function evaluateEngagement(deal: DealInputs, platform: PlatformConfig, isUgc: boolean): RateResult["engagement"] {
  const basis = platform.engagement.basis;
  if (isUgc || deal.engagementRate === null) {
    return {
      provided: false,
      rate: null,
      benchmark: null,
      ratio: null,
      label: isUgc ? "Not used for UGC" : "Not provided — assumed typical",
      multiplier: 1,
      basis,
    };
  }
  const benchmark = engagementBenchmark(deal.platform, deal.followers);
  const ratio = deal.engagementRate / benchmark;
  const tiers = CFG.engagementTiers;
  const tier = tiers.find((t) => ratio < t.belowRatio) ?? tiers[tiers.length - 1];
  return {
    provided: true,
    rate: deal.engagementRate,
    benchmark,
    ratio,
    label: tier.label,
    multiplier: tier.multiplier,
    basis,
  };
}

function buildNotes(
  deal: DealInputs,
  ctx: {
    platform: PlatformConfig;
    content: ContentTypeConfig;
    isUgc: boolean;
    views: number;
    estimated: boolean;
    engagement: RateResult["engagement"];
  },
): { notes: ReliabilityNote[]; unusualCount: number } {
  const r = CFG.reliability;
  const notes: ReliabilityNote[] = [];
  let unusualCount = 0;
  const followers = deal.followers ?? 0;
  const noun = viewsNoun(ctx.content);
  const audienceNoun = ctx.platform.audienceNoun;

  if (ctx.isUgc) {
    notes.push({
      id: "ugc",
      tone: "info",
      title: "UGC is priced on the work and the rights",
      body: "Because the content isn't posted to your audience, your follower count doesn't drive this price — the content itself and how the brand can use it do.",
    });
  }

  if (!ctx.isUgc && followers > 0 && followers < r.smallAccountFollowers) {
    unusualCount++;
    notes.push({
      id: "small-account",
      tone: "info",
      title: "Small audience, real value",
      body: "With a smaller audience, most of your rate reflects the content itself — much like UGC pricing. Some brands offer product-only deals at this size; whether that's worth it is your call.",
    });
  }

  if (!ctx.isUgc && followers >= r.largeAccountFollowers) {
    unusualCount++;
    notes.push({
      id: "large-account",
      tone: "caution",
      title: "Large-account pricing varies widely",
      body: "Deals at this size are usually negotiated by managers or agencies and can land far above a formula. Treat this as a starting reference, not a ceiling.",
    });
  }

  if (!ctx.isUgc && !ctx.estimated && followers > 0) {
    if (ctx.views > followers * r.viewsHighMultipleOfFollowers) {
      unusualCount++;
      notes.push({
        id: "views-high",
        tone: "caution",
        title: `Your ${noun} are far above your ${audienceNoun}`,
        body: "That's great if it's typical. Just make sure the number reflects your usual performance, not one viral post — brands will check.",
      });
    } else if (followers >= r.smallAccountFollowers && ctx.views < followers * r.viewsLowShareOfFollowers) {
      unusualCount++;
      notes.push({
        id: "views-low",
        tone: "caution",
        title: `Your ${noun} are low compared with your ${audienceNoun}`,
        body: `This estimate is based on the ${noun} you entered. Brands increasingly price on real ${noun}, so recent performance matters more than ${audienceNoun}.`,
      });
    }
  }

  const e = ctx.engagement;
  if (e.provided && e.rate !== null && e.ratio !== null) {
    if (e.rate > r.engagementUnusualPercent || e.ratio > r.engagementUnusualRatio) {
      unusualCount++;
      const basisHint =
        e.basis === "views"
          ? `For ${ctx.platform.label}, we measure engagement as ${ctx.platform.engagement.interactions} divided by views.`
          : `For ${ctx.platform.label}, we measure engagement as ${ctx.platform.engagement.interactions} divided by ${audienceNoun}.`;
      notes.push({
        id: "engagement-high",
        tone: "caution",
        title: "That engagement rate is unusually high",
        body: `${basisHint} If ${formatPercent(e.rate)} is right, it's a strong negotiating point — we cap its effect so one number can't run away with the price.`,
      });
    } else if (e.ratio < r.engagementVeryLowRatio) {
      unusualCount++;
      notes.push({
        id: "engagement-low",
        tone: "info",
        title: "Engagement is well below typical",
        body: "Brands that review analytics may push back on price. If your views are strong, lead with those in the conversation.",
      });
    }
  }

  if (ctx.estimated && !ctx.isUgc) {
    notes.push({
      id: "views-estimated",
      tone: "info",
      title: `We estimated your ${noun}`,
      body:
        followers > 0
          ? `We assumed about ${formatNumber(roughly(ctx.views))} ${noun} from ${formatCompact(followers)} ${audienceNoun}. Enter your real typical ${noun} for a tighter range.`
          : `Add your ${audienceNoun} or typical ${noun} for an audience-based estimate.`,
    });
  }

  if (!ctx.isUgc && !e.provided) {
    notes.push({
      id: "engagement-missing",
      tone: "info",
      title: "Engagement assumed typical",
      body: `Without an engagement rate we assumed typical engagement for ${ctx.platform.label}. Adding yours can move the price either way.`,
    });
  }

  if (deal.platform === "twitch") {
    notes.push({
      id: "twitch",
      tone: "info",
      title: "Twitch deals are often priced per hour",
      body: "Many streamers price by stream hour or average concurrent viewers. Use this as a reference point and translate it into the format you normally sell.",
    });
  }

  if (deal.usage !== "none" && deal.usageDuration === "perpetual") {
    notes.push({
      id: "perpetual",
      tone: "caution",
      title: "Perpetual means forever",
      body: "Perpetual rights let the brand use your content indefinitely. Many creators avoid perpetual terms or only accept them at a significant premium.",
    });
  }

  // Cautions first, then info.
  notes.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === "caution" ? -1 : 1));
  return { notes, unusualCount };
}

function confidenceFor(spread: number): Confidence {
  if (spread <= CFG.confidence.goodMaxSpread) return "good";
  if (spread <= CFG.confidence.fairMaxSpread) return "fair";
  return "rough";
}

/** Range + negotiation positions, rounded and kept in a sensible order. */
export function priceLadder(midpoint: number, spread: number) {
  const { askPosition, targetPosition, floorFactor } = CFG.strategy;
  const lowRaw = midpoint * (1 - spread);
  const highRaw = midpoint * (1 + spread);

  const fairValue = roundPrice(midpoint);
  const low = roundPrice(lowRaw);
  const high = Math.max(roundPrice(highRaw), fairValue);
  let ask = roundPrice(midpoint + askPosition * (highRaw - midpoint));
  let target = roundPrice(midpoint - targetPosition * (midpoint - lowRaw));
  let floor = roundPrice(lowRaw * floorFactor);

  if (ask > high) ask = high;
  if (target < low) target = low;
  if (target > ask) target = ask;
  if (floor >= low) floor = Math.max(low - roundingStep(low), roundingStep(1));

  return { fairValue, low, high, ask, target, floor };
}

function compare(currentRate: number | null | undefined, low: number, high: number, ask: number) {
  if (!currentRate || currentRate <= 0) return null;
  let status: ComparisonStatus;
  if (currentRate < low * CFG.comparison.wellBelowFactor) status = "well-below";
  else if (currentRate < low) status = "below";
  else if (currentRate <= high) status = "within";
  else status = "above";
  return { currentRate, status, askMultiple: ask / currentRate };
}

export function calculateRate(input: DealInputs): RateResult {
  const deal = sanitizeDeal(input);
  const platform = getPlatform(deal.platform);
  const content = getContentType(deal.platform, deal.contentType) ?? getContentTypes(deal.platform)[0];
  const isUgc = Boolean(content.ugc);
  const lines: BreakdownLine[] = [];
  const noun = viewsNoun(content);

  // 1. Expected reach. Prefer real typical views; estimate only if we must.
  let views = 0;
  let estimated = false;
  if (!isUgc) {
    if (deal.views !== null) {
      views = deal.views;
    } else {
      views = estimateViews(deal.platform, content.id, deal.followers);
      estimated = true;
    }
  }
  const sizeTier = deal.followers ? getSizeTier(deal.followers).id : null;

  // 2. Base = audience value + creation fee.
  const audience = isUgc ? 0 : (views / 1000) * content.cpm;
  const creation = content.creationFee;

  if (!isUgc) {
    lines.push({
      id: "audience",
      label: "Audience / expected reach",
      detail: estimated
        ? `~${formatNumber(roughly(views))} ${noun} (estimated from your ${platform.audienceNoun}) × $${content.cpm} per 1,000`
        : `${formatNumber(views)} typical ${noun} × $${content.cpm} per 1,000`,
      kind: "base",
      amount: audience,
      active: true,
    });
  }
  lines.push({
    id: "creation",
    label: "Content creation",
    detail: isUgc
      ? "Concept, filming, and editing a video for the brand to use"
      : content.custom
        ? "Your time, skills, and production for the deliverable"
        : `Your time, skills, and production for one ${content.noun.one}`,
    kind: "base",
    amount: creation,
    active: true,
  });

  // 3. Percentage adjustments, applied in order so each line shows its dollar impact.
  let running = audience + creation;
  const adjust = (id: BreakdownLine["id"], label: string, detail: string, multiplier: number) => {
    const delta = running * (multiplier - 1);
    running += delta;
    lines.push({ id, label, detail, kind: "adjustment", amount: delta, percent: multiplier - 1, active: multiplier !== 1 });
  };

  const engagement = evaluateEngagement(deal, platform, isUgc);
  if (!isUgc) {
    adjust(
      "engagement",
      "Engagement",
      engagement.provided && engagement.rate !== null && engagement.benchmark !== null
        ? `${engagement.label}: ${formatPercent(engagement.rate)} vs. ~${formatPercent(engagement.benchmark)} ${
            engagement.basis === "followers" && deal.followers ? "for accounts your size" : `on ${platform.label}`
          }`
        : engagement.label,
      engagement.multiplier,
    );

    const location = CFG.locations[deal.location];
    adjust(
      "location",
      "Audience location",
      location.label,
      location.multiplier,
    );
  }

  const niche = getNiche(deal.niche);
  adjust("niche", "Niche", `${niche.label} — ${niche.bandLabel.toLowerCase()}`, niche.multiplier);

  const production = CFG.production[deal.production];
  adjust(
    "production",
    "Production effort",
    production.label,
    production.multiplier,
  );

  const perPiece = running;

  // 4. Deliverables.
  const extraFactor = CFG.deliverables.additionalPieceFactor;
  const contentFee = perPiece * (1 + (deal.deliverables - 1) * extraFactor);
  if (deal.deliverables > 1) {
    lines.push({
      id: "deliverables",
      label: "Additional deliverables",
      detail: `${deal.deliverables} pieces — each extra one at ${pct(extraFactor)} of the first`,
      kind: "fee",
      amount: contentFee - perPiece,
      active: true,
    });
  }

  // 5. Commercial terms, as shares of the content fee.
  const usageShare = usageFeeShare(deal.usage, deal.usageDuration);
  const usageFee = contentFee * usageShare;
  const usageType = CFG.usageTypes[deal.usage];
  const duration = CFG.usageDurations[deal.usageDuration];
  lines.push({
    id: "usage",
    label: "Usage rights",
    detail:
      deal.usage === "none"
        ? "None requested — posted on your account only"
        : `${usageType.shortLabel}, ${duration.label.toLowerCase()} — ${pct(usageShare)} of the content fee`,
    kind: "fee",
    amount: usageFee,
    percent: usageShare,
    active: usageShare > 0,
  });

  const exclusivity = CFG.exclusivity[deal.exclusivity];
  const exclusivityFee = contentFee * exclusivity.fee;
  lines.push({
    id: "exclusivity",
    label: "Exclusivity",
    detail:
      deal.exclusivity === "none" ? "None requested" : `${exclusivity.label} — ${pct(exclusivity.fee)} of the content fee`,
    kind: "fee",
    amount: exclusivityFee,
    percent: exclusivity.fee,
    active: exclusivity.fee > 0,
  });

  const timeline = CFG.timelines[deal.timeline];
  const rushFee = contentFee * timeline.fee;
  lines.push({
    id: "rush",
    label: "Rush delivery",
    detail: deal.timeline === "normal" ? "Normal timeline — no rush fee" : `${timeline.label} — ${pct(timeline.fee)} of the content fee`,
    kind: "fee",
    amount: rushFee,
    percent: timeline.fee,
    active: timeline.fee > 0,
  });

  const total = Math.max(contentFee + usageFee + exclusivityFee + rushFee, CFG.minimumRate);

  // 6. Uncertainty → range width.
  const { notes, unusualCount } = buildNotes(deal, { platform, content, isUgc, views, estimated, engagement });
  const r = CFG.range;
  let spread: number = r.baseSpread;
  if (!isUgc && estimated) spread += r.estimatedViewsSpread;
  if (!isUgc && !engagement.provided) spread += r.missingEngagementSpread;
  spread += unusualCount * r.unusualInputSpread;
  spread = Math.min(spread, r.maxSpread);

  const ladder = priceLadder(total, spread);

  return {
    deal,
    platform,
    content,
    isUgc,
    reach: { views, estimated, sizeTier },
    engagement,
    lines,
    components: {
      audience,
      creation,
      perPiece,
      content: contentFee,
      usage: usageFee,
      exclusivity: exclusivityFee,
      rush: rushFee,
      total,
    },
    ...ladder,
    spread,
    confidence: confidenceFor(spread),
    notes,
    comparison: compare(deal.currentRate, ladder.low, ladder.high, ladder.ask),
  };
}
