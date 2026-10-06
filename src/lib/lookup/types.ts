/**
 * Public profile stats pulled from a platform, normalized for the calculator.
 * Shared by the serverless lookup endpoint and the browser. Imports stay
 * relative (no "@/" alias) so the serverless bundler can resolve them.
 */

export type LookupPlatform = "youtube" | "instagram" | "tiktok";

/** Groups of content we measure separately (YouTube Shorts behave differently from long-form). */
export type FormatKey = "long" | "short" | "reel" | "post" | "video";

export interface FormatStats {
  /** Median views of recent posts in this format — typical, not best. */
  typicalViews: number | null;
  /** Median engagement rate in percent, on the platform's usual basis. */
  engagementRate: number | null;
  /** How many recent posts the numbers come from. */
  sampleSize: number;
}

export interface ProfileStats {
  platform: LookupPlatform;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  profileUrl: string;
  /** Followers/subscribers, or null when the account hides it. */
  followers: number | null;
  formats: Partial<Record<FormatKey, FormatStats>>;
  fetchedAt: string;
}

export type LookupErrorCode = "invalid_handle" | "not_found" | "unsupported" | "unavailable";

export interface LookupError {
  error: LookupErrorCode;
  message: string;
}

/** Thrown by platform adapters; the endpoint turns it into a LookupError response. */
export class LookupFailure extends Error {
  readonly code: LookupErrorCode;

  constructor(code: LookupErrorCode, message: string) {
    super(message);
    this.name = "LookupFailure";
    this.code = code;
  }
}

export function median(values: number[]): number | null {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
