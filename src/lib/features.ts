/**
 * Feature flags. Flip a flag to ship or hide a module without touching the
 * calculator. NEXT_PUBLIC_* values are inlined at build time.
 */
export const FEATURES = {
  /** Itemized quote + brand reply on the results page. */
  quoteGenerator: true,
  /** "Adjust the deal" panel with the usage-rights ladder and what-if chips. */
  dealAdjuster: true,
  /** "You may be undercharging" comparison with the creator's current rate. */
  rateComparison: true,
  /** Copy a shareable link to the result. */
  shareLink: true,
  /**
   * Future: "Paste the brand's email" → extract deal terms → price the deal.
   * The extraction interface lives in src/lib/deal-extraction.
   */
  dealEmailParser: process.env.NEXT_PUBLIC_FEATURE_DEAL_PARSER === "true",
  /**
   * "Fill this in from your channel": looks up public stats by handle via
   * /api/profile (functions/api/profile.ts). Turn on together with the
   * endpoint's YOUTUBE_API_KEY.
   */
  profileLookup: process.env.NEXT_PUBLIC_FEATURE_PROFILE_LOOKUP === "true",
} as const;
