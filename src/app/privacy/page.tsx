import type { Metadata } from "next";
import Link from "next/link";
import {
  ExternalLink,
  GOOGLE_PRIVACY_URL,
  GOOGLE_SECURITY_SETTINGS_URL,
  YOUTUBE_TERMS_URL,
} from "@/components/site/legal-links";
import { ADS_ENABLED } from "@/lib/ads";
import { FEATURES } from "@/lib/features";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What How Much Should I Charge? collects (very little) and what it doesn't.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6 sm:pt-16">
      <h1 className="text-4xl font-semibold tracking-tight">Privacy</h1>
      <div className="mt-8 grid gap-5 text-[16px] leading-relaxed text-ink-soft">
        <p>
          <strong className="font-semibold text-ink">No account, no personal data.</strong> The calculation runs entirely in
          your browser. Your current rate and any names you type into the quote generator never leave your device.
        </p>
        <p>
          <strong className="font-semibold text-ink">Shareable links.</strong> Your result is saved in the page address so
          you can bookmark or share it. That link contains your deal answers (platform, audience size, terms) but never
          your current rate or names. Like any web address, it&apos;s visible to anyone you share it with and may appear in
          standard server logs.
        </p>
        <p>
          <strong className="font-semibold text-ink">Anonymous usage statistics.</strong> We count anonymous events — such
          as a calculation being completed or a quote being copied — with coarse details like the platform and an audience
          size bucket. We don&apos;t use cookies for this, and we can&apos;t identify you from it.
        </p>
        {FEATURES.profileLookup ? (
          <p id="youtube">
            <strong className="font-semibold text-ink">Channel lookup (YouTube API Services).</strong> If you use “Fill this
            in from your channel”, the handle or link you enter is sent to our server, which asks the YouTube API Services
            for that channel&apos;s public statistics. This site uses YouTube API Services, so the{" "}
            <ExternalLink href={GOOGLE_PRIVACY_URL}>Google Privacy Policy</ExternalLink> also applies, and using the lookup
            means agreeing to the <ExternalLink href={YOUTUBE_TERMS_URL}>YouTube Terms of Service</ExternalLink>. We work
            out typical views and engagement from those public numbers and keep the result in our hosting provider&apos;s
            (Cloudflare) cache for up to 12 hours so repeat lookups are fast. We don&apos;t store anything else and keep no
            record of who looked up which channel. The channel picture loads directly from Google&apos;s servers. We
            don&apos;t use Google sign-in and never get access to your account; you can review the apps connected to your
            Google account in <ExternalLink href={GOOGLE_SECURITY_SETTINGS_URL}>Google&apos;s security settings</ExternalLink>.
          </p>
        ) : null}
        {ADS_ENABLED ? (
          <p>
            <strong className="font-semibold text-ink">Advertising.</strong> Some content pages show ads from our
            advertising partner, Adsterra, which may use cookies or similar technologies under its own privacy policy. Ads
            run in an isolated frame: they can&apos;t read this site or your calculator answers, and they never appear
            inside the calculator or your quote.
          </p>
        ) : null}
        <p>
          <strong className="font-semibold text-ink">Progress in your browser.</strong> While you&apos;re filling in the
          calculator, your answers are kept in this browser tab&apos;s session storage so you don&apos;t lose them if you
          switch apps. They&apos;re cleared when the tab closes.
        </p>
        <p>
          See also our{" "}
          <Link href="/terms" className="font-medium text-ink underline decoration-line-strong underline-offset-4">
            terms of use
          </Link>
          .
          {SITE.contactEmail ? (
            <>
              {" "}
              Questions or requests:{" "}
              <a href={`mailto:${SITE.contactEmail}`} className="font-medium text-ink underline decoration-line-strong underline-offset-4">
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
