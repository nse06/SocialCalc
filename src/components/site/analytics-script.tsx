import Script from "next/script";

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const PLAUSIBLE_SRC = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js";

/**
 * Loads Plausible (cookie-less, no personal data) when NEXT_PUBLIC_PLAUSIBLE_DOMAIN
 * is set. Renders nothing otherwise. Custom events go through src/lib/analytics.ts.
 */
export function AnalyticsScript() {
  if (!PLAUSIBLE_DOMAIN) return null;
  return (
    <>
      <Script id="plausible-queue" strategy="afterInteractive">
        {"window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)};"}
      </Script>
      <Script defer data-domain={PLAUSIBLE_DOMAIN} src={PLAUSIBLE_SRC} strategy="afterInteractive" />
    </>
  );
}
