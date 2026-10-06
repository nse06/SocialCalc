/**
 * Typed accessors over PRICING_CONFIG so UI and engine code never index the
 * raw config directly.
 */
import { PRICING_CONFIG } from "./config";
import type {
  ContentTypeConfig,
  ExclusivityId,
  LocationId,
  NicheId,
  PlatformConfig,
  PlatformId,
  ProductionId,
  SizeTierId,
  TimelineId,
  UsageDurationId,
  UsageTypeId,
} from "./types";

const keysOf = <T extends object>(obj: T) => Object.keys(obj) as (keyof T)[];

export const PLATFORM_IDS = keysOf(PRICING_CONFIG.platforms) as PlatformId[];
export const NICHE_IDS = keysOf(PRICING_CONFIG.niches) as NicheId[];
export const LOCATION_IDS = keysOf(PRICING_CONFIG.locations) as LocationId[];
export const PRODUCTION_IDS = keysOf(PRICING_CONFIG.production) as ProductionId[];
export const USAGE_TYPE_IDS = keysOf(PRICING_CONFIG.usageTypes) as UsageTypeId[];
export const USAGE_DURATION_IDS = keysOf(PRICING_CONFIG.usageDurations) as UsageDurationId[];
export const EXCLUSIVITY_IDS = keysOf(PRICING_CONFIG.exclusivity) as ExclusivityId[];
export const TIMELINE_IDS = keysOf(PRICING_CONFIG.timelines) as TimelineId[];

export function isPlatformId(value: unknown): value is PlatformId {
  return typeof value === "string" && (PLATFORM_IDS as string[]).includes(value);
}

export function isOneOf<T extends string>(ids: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (ids as readonly string[]).includes(value);
}

export function getPlatform(id: PlatformId): PlatformConfig {
  return PRICING_CONFIG.platforms[id] as PlatformConfig;
}

export function getContentTypes(platform: PlatformId): readonly ContentTypeConfig[] {
  return getPlatform(platform).contentTypes;
}

export function getContentType(platform: PlatformId, id: string | null | undefined): ContentTypeConfig | undefined {
  if (!id) return undefined;
  return getContentTypes(platform).find((c) => c.id === id);
}

export function isUgcContent(platform: PlatformId | null, contentType: string | null | undefined): boolean {
  if (!platform) return false;
  return Boolean(getContentType(platform, contentType)?.ugc);
}

export function getSizeTier(followers: number): { id: SizeTierId; label: string; reachFactor: number; engagementBenchmarkFactor: number } {
  const tiers = PRICING_CONFIG.sizeTiers;
  return tiers.find((t) => followers < t.upTo) ?? tiers[tiers.length - 1];
}

export function getNiche(id: NicheId) {
  const niche = PRICING_CONFIG.niches[id];
  const band = PRICING_CONFIG.nicheBands[niche.band];
  return { ...niche, bandLabel: band.label, multiplier: band.multiplier };
}

export function usageFeeShare(usage: UsageTypeId, duration: UsageDurationId): number {
  return PRICING_CONFIG.usageTypes[usage].fees[duration];
}

/** The display name of a deliverable, honoring a creator's custom label. */
export function deliverableName(content: ContentTypeConfig, customLabel?: string): string {
  const label = customLabel?.trim();
  if (content.custom && label) return label;
  return content.name;
}
