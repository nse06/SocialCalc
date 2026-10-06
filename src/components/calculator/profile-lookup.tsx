"use client";

import { useEffect, useRef, useState } from "react";
import { YOUTUBE_TERMS_URL } from "@/components/site/legal-links";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/ui/icons";
import { audienceBucket, track } from "@/lib/analytics";
import { type ProfilePrefill, lookupProfile, profilePrefill } from "@/lib/lookup/client";
import { parseHandle } from "@/lib/lookup/parse-handle";
import type { FormatKey, LookupErrorCode, LookupPlatform, ProfileStats } from "@/lib/lookup/types";
import { getPlatform } from "@/lib/pricing/catalog";
import type { CalculatorDraft } from "@/lib/pricing/draft";
import { capitalize, formatCompact, formatPercent, joinList } from "@/lib/pricing/format";

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; profile: ProfileStats; prefill: ProfilePrefill };

const ERROR_COPY: Record<LookupErrorCode, string> = {
  invalid_handle: "That doesn't look like a handle or channel link. Try @yourchannel.",
  not_found: "We couldn't find that channel. Check the spelling, or enter your numbers below.",
  unsupported: "Lookup isn't available for this platform yet. Enter your numbers below.",
  unavailable: "Lookup isn't available right now. Enter your numbers below.",
};

const FORMAT_NAMES: Partial<Record<FormatKey, [one: string, many: string]>> = {
  long: ["long-form video", "long-form videos"],
  short: ["Short", "Shorts"],
};

/** Remembered for the session, so coming back to this step is one click. */
let lastHandle = "";

function summary({ patch, format, stats }: ProfilePrefill, audienceNoun: string): string {
  const names = format ? FORMAT_NAMES[format] : undefined;
  const filled = [
    patch.followers ? `${audienceNoun} (${formatCompact(patch.followers)})` : "",
    patch.views ? `typical views (${formatCompact(patch.views)})` : "",
    patch.engagementRate ? `engagement (${formatPercent(patch.engagementRate)})` : "",
  ].filter(Boolean);
  const source =
    stats && names && (patch.views || patch.engagementRate)
      ? ` from ${stats.sampleSize} recent ${stats.sampleSize === 1 ? names[0] : names[1]}`
      : "";
  return [
    filled.length ? `Filled in your ${joinList(filled)}${source}. Check them and change anything that looks off.` : "",
    patch.followers ? "" : `This channel hides its ${audienceNoun.replace(/s$/, "")} count, so add it below.`,
    patch.views ? "" : names ? `We didn't find recent ${names[1]}, so add your typical views below.` : "Add your typical views below.",
  ]
    .filter(Boolean)
    .join(" ");
}

/** "Fill this in from your channel": looks up public stats and pre-fills the audience answers. */
export function ProfileLookup({ draft, update }: { draft: CalculatorDraft; update: (patch: Partial<CalculatorDraft>) => void }) {
  const platform = draft.platform as LookupPlatform;
  const { label, audienceNoun } = getPlatform(platform);
  const [input, setInput] = useState(lastHandle);
  const [state, setState] = useState<LookupState>({ status: "idle" });
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  async function run() {
    const parsed = parseHandle(input, platform);
    if (!parsed || parsed.platform !== platform) {
      setState({ status: "error", message: ERROR_COPY.invalid_handle });
      return;
    }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setState({ status: "loading" });

    let result: Awaited<ReturnType<typeof lookupProfile>>;
    try {
      result = await lookupProfile(platform, input.trim(), controller.signal);
    } catch {
      return; // Replaced by a newer lookup, or the step closed.
    }
    if (!result.ok) {
      setState({ status: "error", message: ERROR_COPY[result.error.error] ?? result.error.message });
      track("profile_lookup", { platform, outcome: result.error.error });
      return;
    }
    const prefill = profilePrefill(result.profile, draft.contentType);
    update(prefill.patch);
    lastHandle = input.trim();
    setState({ status: "done", profile: result.profile, prefill });
    track("profile_lookup", {
      platform,
      outcome: "found",
      audience: audienceBucket(result.profile.followers),
      filled_views: Boolean(prefill.patch.views),
      filled_engagement: Boolean(prefill.patch.engagementRate),
    });
  }

  if (state.status === "done") {
    const { profile, prefill } = state;
    const avatar = profile.avatarUrl?.startsWith("https://") ? profile.avatarUrl : null;
    return (
      <section aria-label="Your channel" className="min-w-0 rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
        <div className="flex items-center gap-3">
          {avatar ? (
            // Remote avatar from the platform's CDN; next/image can't optimize it in a static export.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" width={44} height={44} referrerPolicy="no-referrer" className="size-11 shrink-0 rounded-full bg-subtle" />
          ) : (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-subtle text-ink-soft">
              <PlatformIcon platform={platform} size={20} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-ink">{profile.displayName}</p>
            <p className="text-sm text-muted [overflow-wrap:anywhere]">
              {profile.handle || label}
              {profile.followers ? ` · ${formatCompact(profile.followers)} ${audienceNoun}` : null}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setState({ status: "idle" })}
            className="shrink-0 rounded-full px-2 py-1 text-sm font-medium text-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink"
          >
            Change
          </button>
        </div>
        <p role="status" className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          {summary(prefill, audienceNoun)}
        </p>
        <p className="mt-2 text-[12.5px] leading-snug text-muted">
          {capitalize(audienceNoun)} come straight from {label}. Typical views and engagement are our own calculations, not{" "}
          {label} metrics: the middle value of recent videos (so one viral hit doesn&apos;t skew it), with engagement as
          likes plus comments divided by views. We sort Shorts from long-form videos ourselves.
        </p>
        <p className="mt-2 text-[12.5px] text-muted">
          <a href={profile.profileUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-ink-soft underline decoration-line-strong underline-offset-4 hover:text-ink">
            Data from {label}
          </a>{" "}
          · as of {new Date(profile.fetchedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </section>
    );
  }

  const loading = state.status === "loading";
  return (
    <section aria-labelledby="profile-lookup-title" className="min-w-0 rounded-2xl border border-accent-line bg-accent-soft/40 p-4 sm:p-5">
      <p id="profile-lookup-title" className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <PlatformIcon platform={platform} size={18} />
        Fill this in from your channel
      </p>
      <label htmlFor="profile-handle" className="mt-1 block text-sm text-muted">
        Your {label} handle or channel link
      </label>
      <div className="mt-2.5 flex gap-2">
        <input
          id="profile-handle"
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          placeholder="@yourchannel"
          value={input}
          aria-invalid={state.status === "error"}
          aria-describedby={state.status === "error" ? "profile-lookup-error" : undefined}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void run();
            }
          }}
          className="h-12 w-full min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-3.5 text-[16px] text-ink outline-none placeholder:text-faint focus:border-accent focus:shadow-[0_0_0_3px_rgb(91_61_245/0.14)]"
        />
        <Button variant="primary" className="h-12 shrink-0" disabled={loading || !input.trim()} onClick={() => void run()}>
          {loading ? "Looking…" : "Look up"}
        </Button>
      </div>
      <p
        id="profile-lookup-error"
        role="status"
        className={state.status === "error" ? "mt-2 text-sm leading-snug text-negative" : "sr-only"}
      >
        {state.status === "error" ? state.message : loading ? `Looking up your ${label} stats…` : ""}
      </p>
      <p className="mt-2 text-[12.5px] leading-snug text-muted">
        We only read public stats — no login. By looking up a channel you agree to the{" "}
        <a href={YOUTUBE_TERMS_URL} target="_blank" rel="noopener noreferrer" className={smallLink}>
          YouTube Terms of Service
        </a>{" "}
        and our{" "}
        <a href="/terms" target="_blank" className={smallLink}>
          Terms
        </a>{" "}
        and{" "}
        <a href="/privacy#youtube" target="_blank" className={smallLink}>
          Privacy Policy
        </a>
        .
      </p>
    </section>
  );
}

const smallLink = "font-medium text-ink-soft underline decoration-line-strong underline-offset-2 hover:text-ink";
