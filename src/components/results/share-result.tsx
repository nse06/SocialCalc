"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { LinkIcon } from "@/components/ui/icons";
import { track } from "@/lib/analytics";
import { formatMoney } from "@/lib/pricing/format";
import type { RateResult } from "@/lib/pricing/types";

/** Native share sheet where the browser supports it (most phones); copy-link everywhere else. */
export function ShareResult({ result }: { result: RateResult }) {
  // Results only render client-side, so checking for the Web Share API during render is safe.
  const [canShare] = useState(() => typeof navigator !== "undefined" && typeof navigator.share === "function");

  if (canShare) {
    return (
      <Button
        variant="ghost"
        onClick={async () => {
          try {
            await navigator.share({
              title: "My brand deal rate",
              text: `My estimated rate: ${formatMoney(result.low)}–${formatMoney(result.high)}`,
              url: window.location.href,
            });
            track("share_link_copied", { platform: result.deal.platform, method: "native" });
          } catch {
            // The person closed the share sheet — nothing to do.
          }
        }}
      >
        <LinkIcon size={16} />
        Share this result
      </Button>
    );
  }

  return (
    <CopyButton
      variant="ghost"
      size="md"
      icon={<LinkIcon size={16} />}
      copiedLabel="Link copied"
      getText={() => window.location.href}
      onCopied={() => track("share_link_copied", { platform: result.deal.platform, method: "copy" })}
    >
      Copy link to this result
    </CopyButton>
  );
}
