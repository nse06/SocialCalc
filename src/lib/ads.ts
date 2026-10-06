/**
 * Display ads (Adsterra). Off until ad keys are set at build time.
 *
 * Each Adsterra banner placement in the dashboard has a key and a fixed size.
 * Create one placement per size and paste the keys here via env vars:
 *   NEXT_PUBLIC_ADSTERRA_KEY_300X250  (phones)
 *   NEXT_PUBLIC_ADSTERRA_KEY_728X90   (tablets/desktop)
 * If your snippet loads invoke.js from a different host, set
 *   NEXT_PUBLIC_ADSTERRA_HOST (default www.highperformanceformat.com)
 *
 * Policy: ads only appear on content sections — never inside the calculator,
 * next to the result, or in the quote — and never as pop-ups.
 */

export interface AdUnit {
  key: string;
  width: number;
  height: number;
}

/** Only accept plain alphanumeric keys and hostnames, so a bad env value can't inject markup. */
const safeKey = (value: string | undefined) => (value && /^[A-Za-z0-9]{8,64}$/.test(value) ? value : undefined);
const safeHost = (value: string | undefined) =>
  value && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value) ? value : "www.highperformanceformat.com";

const host = safeHost(process.env.NEXT_PUBLIC_ADSTERRA_HOST);
const rectangleKey = safeKey(process.env.NEXT_PUBLIC_ADSTERRA_KEY_300X250);
const leaderboardKey = safeKey(process.env.NEXT_PUBLIC_ADSTERRA_KEY_728X90);

export const ADS = {
  host,
  /** Shown below the md breakpoint. */
  mobile: rectangleKey ? { key: rectangleKey, width: 300, height: 250 } : null,
  /** Shown from the md breakpoint up (falls back to the rectangle). */
  desktop: leaderboardKey
    ? { key: leaderboardKey, width: 728, height: 90 }
    : rectangleKey
      ? { key: rectangleKey, width: 300, height: 250 }
      : null,
} satisfies { host: string; mobile: AdUnit | null; desktop: AdUnit | null };

export const ADS_ENABLED = Boolean(ADS.mobile || ADS.desktop);

/** Where ads may appear. Results stay ad-free by default to protect trust in the number. */
export const AD_PLACEMENTS = {
  landingArticle: true,
  landingFooter: true,
  methodology: true,
} as const;

export type AdPlacement = keyof typeof AD_PLACEMENTS;

/** The official Adsterra snippet, isolated in its own document so units never clash. */
export function adDocument(unit: AdUnit, scriptHost: string = ADS.host): string {
  const options = JSON.stringify({ key: unit.key, format: "iframe", height: unit.height, width: unit.width, params: {} });
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body><script>atOptions = ${options};</script><script src="https://${scriptHost}/${encodeURIComponent(unit.key)}/invoke.js"></script></body></html>`;
}
