"use client";

import { type CSSProperties, useSyncExternalStore } from "react";
import { ADS, ADS_ENABLED, AD_PLACEMENTS, type AdPlacement, adDocument } from "@/lib/ads";
import { cn } from "@/lib/cn";

const DESKTOP_QUERY = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * One clearly labeled ad. Renders only the unit that fits the screen (hidden
 * ads would count as invalid impressions), loads lazily, and reserves its
 * space up front so content never jumps.
 *
 * The ad runs in a sandboxed frame without same-origin access, so ad scripts
 * can't read this page or the creator's saved answers.
 */
export function AdSlot({ placement, className }: { placement: AdPlacement; className?: string }) {
  const isDesktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => null,
  );

  if (!ADS_ENABLED || !AD_PLACEMENTS[placement]) return null;

  const unit = isDesktop === null ? null : isDesktop ? ADS.desktop : ADS.mobile;

  return (
    <aside aria-label="Advertisement" className={cn("flex flex-col items-center", className)}>
      <p className="mb-1.5 text-[11px] tracking-[0.08em] text-muted uppercase">Advertisement</p>
      <div
        className="flex h-[var(--ad-h)] w-full items-center justify-center md:h-[var(--ad-h-md)]"
        style={{ "--ad-h": `${ADS.mobile?.height ?? 0}px`, "--ad-h-md": `${ADS.desktop?.height ?? 0}px` } as CSSProperties}
      >
        {unit ? (
          <iframe
            title="Advertisement"
            width={unit.width}
            height={unit.height}
            srcDoc={adDocument(unit)}
            loading="lazy"
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="strict-origin-when-cross-origin"
            className="max-w-full border-0"
          />
        ) : null}
      </div>
    </aside>
  );
}
