/**
 * Browser side of the profile lookup: calls the endpoint and maps a profile
 * onto calculator answers. The endpoint lives in functions/api/profile.ts.
 */
import { PRICING_CONFIG } from "@/lib/pricing/config";
import type { CalculatorDraft } from "@/lib/pricing/draft";
import type { PlatformId } from "@/lib/pricing/types";
import type { FormatKey, FormatStats, LookupError, LookupPlatform, ProfileStats } from "./types";

const ENDPOINT = process.env.NEXT_PUBLIC_PROFILE_LOOKUP_ENDPOINT || "/api/profile";

/** Platforms the endpoint can look up today. */
const SUPPORTED: readonly PlatformId[] = ["youtube"];

export function supportsLookup(platform: PlatformId | null): platform is LookupPlatform {
  return platform !== null && SUPPORTED.includes(platform);
}

/** The measured format that matches each calculator content type. */
const CONTENT_FORMATS: Record<LookupPlatform, Partial<Record<string, FormatKey>>> = {
  youtube: { short: "short", integration: "long", dedicated: "long", custom: "long" },
  instagram: { reel: "reel", "feed-post": "post", carousel: "post" },
  tiktok: { sponsored: "video", "plus-story": "video" },
};

export interface ProfilePrefill {
  /** Answers to merge into the calculator draft. */
  patch: Partial<CalculatorDraft>;
  format: FormatKey | null;
  stats: FormatStats | null;
}

/** Which answers a profile can fill in for the chosen content type. */
export function profilePrefill(profile: ProfileStats, contentType: string | null): ProfilePrefill {
  const format = (contentType && CONTENT_FORMATS[profile.platform][contentType]) || null;
  const stats = (format && profile.formats[format]) || null;
  const limits = PRICING_CONFIG.limits;
  const patch: Partial<CalculatorDraft> = {};
  if (profile.followers && profile.followers > 0) patch.followers = Math.min(profile.followers, limits.maxFollowers);
  if (stats?.typicalViews && stats.typicalViews > 0) {
    patch.views = Math.min(stats.typicalViews, limits.maxViews);
    patch.viewsUnknown = false;
  }
  if (stats?.engagementRate && stats.engagementRate > 0) {
    patch.engagementRate = Math.min(stats.engagementRate, limits.maxEngagementPercent);
    patch.engagementSkipped = false;
  }
  return { patch, format, stats };
}

export type LookupResult = { ok: true; profile: ProfileStats } | { ok: false; error: LookupError };

const UNAVAILABLE: LookupError = { error: "unavailable", message: "Lookup isn't available right now." };

function isProfile(value: unknown): value is ProfileStats {
  const profile = value as Partial<ProfileStats> | null;
  return Boolean(profile && typeof profile.displayName === "string" && profile.formats && typeof profile.formats === "object");
}

function isLookupError(value: unknown): value is LookupError {
  const error = value as Partial<LookupError> | null;
  return Boolean(error && typeof error.error === "string" && typeof error.message === "string");
}

export async function lookupProfile(platform: LookupPlatform, handle: string, signal?: AbortSignal): Promise<LookupResult> {
  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}?${new URLSearchParams({ platform, handle })}`, {
      signal,
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    return { ok: false, error: UNAVAILABLE };
  }
  // Without the endpoint deployed (local dev, plain static hosting) this is an HTML 404.
  const body: unknown = await response.json().catch(() => null);
  if (response.ok && isProfile(body)) return { ok: true, profile: body };
  return { ok: false, error: isLookupError(body) ? body : UNAVAILABLE };
}
