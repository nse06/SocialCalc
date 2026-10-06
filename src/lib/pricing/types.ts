import type { PricingConfig } from "./config";

export type PlatformId = keyof PricingConfig["platforms"];
export type NicheId = keyof PricingConfig["niches"];
export type LocationId = keyof PricingConfig["locations"];
export type ProductionId = keyof PricingConfig["production"];
export type UsageTypeId = keyof PricingConfig["usageTypes"];
export type UsageDurationId = keyof PricingConfig["usageDurations"];
export type ExclusivityId = keyof PricingConfig["exclusivity"];
export type TimelineId = keyof PricingConfig["timelines"];
export type SizeTierId = PricingConfig["sizeTiers"][number]["id"];
export type EngagementBasis = "followers" | "views";

export interface ContentTypeConfig {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  /** Name used on quotes, e.g. "Sponsored Instagram Reel". */
  readonly name: string;
  /** Lower-case noun used in sentences, e.g. "one sponsored Reel". */
  readonly noun: { readonly one: string; readonly many: string };
  readonly viewsLabel: string;
  /** What one "view" is called for this format. Defaults to "views". */
  readonly viewsNoun?: string;
  readonly cpm: number;
  readonly creationFee: number;
  readonly reachRate: number;
  readonly ugc?: boolean;
  readonly custom?: boolean;
}

export interface PlatformConfig {
  readonly label: string;
  readonly audienceNoun: string;
  readonly engagement: {
    readonly basis: EngagementBasis;
    readonly benchmark: number;
    readonly interactions: string;
  };
  readonly contentTypes: readonly ContentTypeConfig[];
}

/**
 * A complete deal description — everything the engine needs.
 * `views` and `engagementRate` are optional: null means "estimate it".
 */
export interface DealInputs {
  platform: PlatformId;
  contentType: string;
  /** Only used for custom deliverables. */
  customLabel?: string;
  production: ProductionId;
  /** Followers/subscribers. Not needed for UGC. */
  followers: number | null;
  /** Typical views/reach per piece. null → estimated from followers. */
  views: number | null;
  /** Engagement rate in percent (3 = 3%). null → assume typical. */
  engagementRate: number | null;
  niche: NicheId;
  location: LocationId;
  usage: UsageTypeId;
  usageDuration: UsageDurationId;
  exclusivity: ExclusivityId;
  deliverables: number;
  timeline: TimelineId;
  /** What the creator charges today (optional, never shared). */
  currentRate?: number | null;
}

export type BreakdownLineId =
  | "audience"
  | "creation"
  | "engagement"
  | "location"
  | "niche"
  | "production"
  | "deliverables"
  | "usage"
  | "exclusivity"
  | "rush";

export interface BreakdownLine {
  id: BreakdownLineId;
  label: string;
  detail: string;
  /** base = starting dollars, adjustment = % multiplier, fee = commercial add-on */
  kind: "base" | "adjustment" | "fee";
  /** Dollar impact of this line (unrounded; negative for discounts). */
  amount: number;
  /** For adjustments: multiplier − 1. For fees: share of the content fee. */
  percent?: number;
  /** false when the factor doesn't apply to this deal (e.g. normal timeline). */
  active: boolean;
}

export interface ReliabilityNote {
  id: string;
  tone: "info" | "caution";
  title: string;
  body: string;
}

export type ComparisonStatus = "well-below" | "below" | "within" | "above";

export interface RateComparison {
  currentRate: number;
  status: ComparisonStatus;
  /** recommended ask ÷ current rate */
  askMultiple: number;
}

export type Confidence = "good" | "fair" | "rough";

export interface RateResult {
  deal: DealInputs;
  platform: PlatformConfig;
  content: ContentTypeConfig;
  isUgc: boolean;
  reach: {
    views: number;
    estimated: boolean;
    sizeTier: SizeTierId | null;
  };
  engagement: {
    provided: boolean;
    rate: number | null;
    benchmark: number | null;
    ratio: number | null;
    label: string;
    multiplier: number;
    basis: EngagementBasis;
  };
  lines: BreakdownLine[];
  /** Unrounded building blocks. `content` includes all deliverables and adjustments. */
  components: {
    audience: number;
    creation: number;
    perPiece: number;
    content: number;
    usage: number;
    exclusivity: number;
    rush: number;
    total: number;
  };
  /** Rounded, display-ready numbers. */
  fairValue: number;
  low: number;
  high: number;
  ask: number;
  target: number;
  floor: number;
  spread: number;
  confidence: Confidence;
  notes: ReliabilityNote[];
  comparison: RateComparison | null;
}
