import type { ReactNode } from "react";

/** Outside documents the YouTube API Services terms require us to reference. */
export const YOUTUBE_TERMS_URL = "https://www.youtube.com/t/terms";
export const GOOGLE_PRIVACY_URL = "https://policies.google.com/privacy";
export const GOOGLE_SECURITY_SETTINGS_URL = "https://security.google.com/settings/security/permissions";

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
    >
      {children}
    </a>
  );
}
