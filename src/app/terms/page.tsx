import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, GOOGLE_PRIVACY_URL, YOUTUBE_TERMS_URL } from "@/components/site/legal-links";
import { FEATURES } from "@/lib/features";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The plain-English terms for using How Much Should I Charge?",
  alternates: { canonical: "/terms" },
};

const linkClass = "font-medium text-ink underline decoration-line-strong underline-offset-4";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6 sm:pt-16">
      <h1 className="text-4xl font-semibold tracking-tight">Terms of use</h1>
      <p className="mt-3 text-sm text-muted">Last updated October 6, 2026</p>
      <div className="mt-8 grid gap-5 text-[16px] leading-relaxed text-ink-soft">
        <p>
          <strong className="font-semibold text-ink">Estimates, not promises.</strong> {SITE.name} gives you a negotiation
          starting point based on{" "}
          <Link href="/methodology" className={linkClass}>
            published assumptions
          </Link>
          . It isn&apos;t financial, legal, or tax advice, and it doesn&apos;t guarantee what any brand will pay.
        </p>
        <p>
          <strong className="font-semibold text-ink">Your answers and messages.</strong> You&apos;re responsible for the
          numbers you enter and for any quote or message you send. The quotes and templates you generate are yours to use.
        </p>
        {FEATURES.profileLookup ? (
          <p id="youtube">
            <strong className="font-semibold text-ink">Channel lookup.</strong> The “Fill this in from your channel” feature
            reads public channel statistics through the YouTube API Services. By using it, you agree to be bound by the{" "}
            <ExternalLink href={YOUTUBE_TERMS_URL}>YouTube Terms of Service</ExternalLink>, and the{" "}
            <ExternalLink href={GOOGLE_PRIVACY_URL}>Google Privacy Policy</ExternalLink> applies to that data. Typical views
            and engagement are our own calculations, not YouTube metrics, and our price estimates are not provided,
            approved, or endorsed by YouTube or Google.
          </p>
        ) : null}
        <p>
          <strong className="font-semibold text-ink">No warranty.</strong> The site is provided “as is”, without warranties
          of any kind. To the extent the law allows, we aren&apos;t liable for losses that come from using it or relying on
          its estimates.
        </p>
        <p>
          <strong className="font-semibold text-ink">Changes.</strong> We may update these terms. The date above shows the
          latest version. See our{" "}
          <Link href="/privacy" className={linkClass}>
            privacy page
          </Link>{" "}
          for what we collect.
          {SITE.contactEmail ? (
            <>
              {" "}
              Questions:{" "}
              <a href={`mailto:${SITE.contactEmail}`} className={linkClass}>
                {SITE.contactEmail}
              </a>
              .
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
