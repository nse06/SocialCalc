/**
 * The calculator's in-progress answers ("draft"), how a draft becomes a
 * priceable deal, and how a deal round-trips through a shareable URL.
 */
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
  isOneOf,
} from "./catalog";
import { PRICING_CONFIG } from "./config";
import type {
  DealInputs,
  ExclusivityId,
  LocationId,
  NicheId,
  PlatformId,
  ProductionId,
  TimelineId,
  UsageDurationId,
  UsageTypeId,
} from "./types";

export interface CalculatorDraft {
  platform: PlatformId | null;
  contentType: string | null;
  customLabel: string;
  production: ProductionId | null;
  followers: number | null;
  views: number | null;
  /** The creator chose "I'm not sure — estimate it". */
  viewsUnknown: boolean;
  engagementRate: number | null;
  /** The creator chose to skip engagement. */
  engagementSkipped: boolean;
  niche: NicheId | null;
  location: LocationId | null;
  usage: UsageTypeId | null;
  usageDuration: UsageDurationId;
  exclusivity: ExclusivityId;
  deliverables: number;
  timeline: TimelineId;
  currentRate: number | null;
}

export const EMPTY_DRAFT: CalculatorDraft = {
  platform: null,
  contentType: null,
  customLabel: "",
  production: null,
  followers: null,
  views: null,
  viewsUnknown: false,
  engagementRate: null,
  engagementSkipped: false,
  niche: null,
  location: null,
  usage: null,
  usageDuration: "90d",
  exclusivity: "none",
  deliverables: 1,
  timeline: "normal",
  currentRate: null,
};

/** A deal preset (e.g. from a landing page) applied over an empty draft. */
export type DraftPreset = Partial<CalculatorDraft>;

export function isUgcDraft(draft: Pick<CalculatorDraft, "platform" | "contentType">): boolean {
  return Boolean(draft.platform && getContentType(draft.platform, draft.contentType)?.ugc);
}

/** Converts a finished draft into engine input, or null if something required is missing. */
export function draftToDeal(draft: CalculatorDraft): DealInputs | null {
  const { platform, contentType, production, niche, usage } = draft;
  if (!platform || !contentType || !production || !niche || !usage) return null;
  if (!getContentType(platform, contentType)) return null;
  const ugc = isUgcDraft(draft);
  if (!ugc && !(draft.followers && draft.followers > 0)) return null;
  const location = draft.location ?? (ugc ? "us-ca" : null);
  if (!location) return null;

  return {
    platform,
    contentType,
    customLabel: draft.customLabel || undefined,
    production,
    followers: ugc ? null : draft.followers,
    views: ugc || draft.viewsUnknown ? null : draft.views,
    engagementRate: ugc || draft.engagementSkipped ? null : draft.engagementRate,
    niche,
    location,
    usage,
    usageDuration: draft.usageDuration,
    exclusivity: draft.exclusivity,
    deliverables: draft.deliverables,
    timeline: draft.timeline,
    currentRate: draft.currentRate,
  };
}

/** Rebuilds a complete draft from a deal (e.g. when editing from the results page). */
export function dealToDraft(deal: DealInputs): CalculatorDraft {
  return {
    ...EMPTY_DRAFT,
    platform: deal.platform,
    contentType: deal.contentType,
    customLabel: deal.customLabel ?? "",
    production: deal.production,
    followers: deal.followers,
    views: deal.views,
    viewsUnknown: deal.views === null,
    engagementRate: deal.engagementRate,
    engagementSkipped: deal.engagementRate === null,
    niche: deal.niche,
    location: deal.location,
    usage: deal.usage,
    usageDuration: deal.usageDuration,
    exclusivity: deal.exclusivity,
    deliverables: deal.deliverables,
    timeline: deal.timeline,
    currentRate: deal.currentRate ?? null,
  };
}

// ---------------------------------------------------------------------------
// Shareable URLs. Short keys keep links tidy. The creator's current rate is
// deliberately never put in the URL.
// ---------------------------------------------------------------------------

const KEYS = {
  platform: "p",
  contentType: "c",
  customLabel: "cl",
  production: "pr",
  followers: "f",
  views: "v",
  engagementRate: "e",
  niche: "n",
  location: "l",
  usage: "u",
  usageDuration: "ud",
  exclusivity: "x",
  deliverables: "d",
  timeline: "t",
} as const;

export function dealToSearchParams(deal: DealInputs): URLSearchParams {
  const params = new URLSearchParams();
  params.set(KEYS.platform, deal.platform);
  params.set(KEYS.contentType, deal.contentType);
  if (deal.customLabel) params.set(KEYS.customLabel, deal.customLabel);
  params.set(KEYS.production, deal.production);
  if (deal.followers) params.set(KEYS.followers, String(deal.followers));
  if (deal.views) params.set(KEYS.views, String(deal.views));
  if (deal.engagementRate) params.set(KEYS.engagementRate, String(deal.engagementRate));
  params.set(KEYS.niche, deal.niche);
  params.set(KEYS.location, deal.location);
  params.set(KEYS.usage, deal.usage);
  if (deal.usage !== "none") params.set(KEYS.usageDuration, deal.usageDuration);
  if (deal.exclusivity !== "none") params.set(KEYS.exclusivity, deal.exclusivity);
  if (deal.deliverables > 1) params.set(KEYS.deliverables, String(deal.deliverables));
  if (deal.timeline !== "normal") params.set(KEYS.timeline, deal.timeline);
  return params;
}

function positiveNumber(value: string | null, max: number): number | null {
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : null;
}

/**
 * A shared result link leaves out views and engagement when they were
 * estimated. Returns the complete draft if the link describes a whole deal,
 * otherwise null (a partial link should still ask the remaining questions).
 */
export function sharedLinkDraft(base: CalculatorDraft, preset: DraftPreset): CalculatorDraft | null {
  const draft: CalculatorDraft = {
    ...base,
    ...preset,
    viewsUnknown: !preset.views,
    engagementSkipped: !preset.engagementRate,
  };
  return draftToDeal(draft) ? draft : null;
}

/**
 * Parses whatever valid fields a URL contains. Invalid values are ignored,
 * so a mangled link degrades to a partially filled calculator, never a crash.
 */
export function searchParamsToPreset(params: URLSearchParams): DraftPreset {
  const preset: DraftPreset = {};
  const limits = PRICING_CONFIG.limits;
  const platform = params.get(KEYS.platform);
  if (isOneOf(PLATFORM_IDS, platform)) {
    preset.platform = platform;
    const contentType = params.get(KEYS.contentType);
    if (getContentType(platform, contentType)) preset.contentType = contentType;
  }
  const customLabel = params.get(KEYS.customLabel);
  if (customLabel) preset.customLabel = customLabel.slice(0, limits.maxCustomLabelLength);

  const production = params.get(KEYS.production);
  if (isOneOf(PRODUCTION_IDS, production)) preset.production = production;

  const followers = positiveNumber(params.get(KEYS.followers), limits.maxFollowers);
  if (followers) preset.followers = Math.round(followers);

  const views = positiveNumber(params.get(KEYS.views), limits.maxViews);
  if (views) preset.views = Math.round(views);

  const engagement = positiveNumber(params.get(KEYS.engagementRate), limits.maxEngagementPercent);
  if (engagement) preset.engagementRate = engagement;

  const niche = params.get(KEYS.niche);
  if (isOneOf(NICHE_IDS, niche)) preset.niche = niche;
  const location = params.get(KEYS.location);
  if (isOneOf(LOCATION_IDS, location)) preset.location = location;
  const usage = params.get(KEYS.usage);
  if (isOneOf(USAGE_TYPE_IDS, usage)) preset.usage = usage;
  const usageDuration = params.get(KEYS.usageDuration);
  if (isOneOf(USAGE_DURATION_IDS, usageDuration)) preset.usageDuration = usageDuration;
  const exclusivity = params.get(KEYS.exclusivity);
  if (isOneOf(EXCLUSIVITY_IDS, exclusivity)) preset.exclusivity = exclusivity;
  const deliverables = positiveNumber(params.get(KEYS.deliverables), PRICING_CONFIG.deliverables.max);
  if (deliverables) preset.deliverables = Math.round(deliverables);
  const timeline = params.get(KEYS.timeline);
  if (isOneOf(TIMELINE_IDS, timeline)) preset.timeline = timeline;

  return preset;
}
