/**
 * Anonymous product analytics.
 *
 * - No personal data: no names, emails, handles, free text, or exact
 *   follower counts — numbers are bucketed before they leave this file.
 * - Provider-agnostic: Plausible (cookie-less) is supported out of the box via
 *   NEXT_PUBLIC_PLAUSIBLE_DOMAIN, and/or any endpoint that accepts a JSON
 *   beacon via NEXT_PUBLIC_ANALYTICS_ENDPOINT. With neither set, events are
 *   only logged in development.
 */

export type AnalyticsEvent =
  | "calculator_started"
  | "platform_selected"
  | "content_type_selected"
  | "calculator_completed"
  | "result_viewed"
  | "result_adjusted"
  | "quote_generated"
  | "quote_copied"
  | "share_link_copied"
  | "deal_email_parsed"
  | "template_copied";

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
    /** In-memory log of events for debugging and end-to-end tests. */
    __analyticsEvents?: { event: AnalyticsEvent; props: Record<string, string | number | boolean> }[];
  }
}

const ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;

export function track(event: AnalyticsEvent, props: AnalyticsProps = {}): void {
  if (typeof window === "undefined") return;
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== null && value !== undefined) clean[key] = value;
  }
  try {
    (window.__analyticsEvents ??= []).push({ event, props: clean });
    window.plausible?.(event, { props: clean });
    if (ENDPOINT && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(ENDPOINT, JSON.stringify({ event, props: clean, path: window.location.pathname }));
    }
    if (process.env.NODE_ENV === "development") {
      console.debug("[analytics]", event, clean);
    }
  } catch {
    // Analytics must never break the product.
  }
}

/** Coarse audience-size bucket — never send exact counts. */
export function audienceBucket(followers: number | null | undefined): string {
  if (!followers) return "none";
  if (followers < 1_000) return "<1K";
  if (followers < 10_000) return "1K-10K";
  if (followers < 100_000) return "10K-100K";
  if (followers < 1_000_000) return "100K-1M";
  return "1M+";
}

/** Coarse price bucket for result events. */
export function priceBucket(amount: number): string {
  if (amount < 100) return "<$100";
  if (amount < 500) return "$100-500";
  if (amount < 1_000) return "$500-1K";
  if (amount < 5_000) return "$1K-5K";
  if (amount < 20_000) return "$5K-20K";
  return "$20K+";
}
