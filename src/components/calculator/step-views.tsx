"use client";

import { type ReactNode, useMemo, useState } from "react";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { PlatformIcon, Minus, Plus, Sparkle } from "@/components/ui/icons";
import { NumberField } from "@/components/ui/number-field";
import { track } from "@/lib/analytics";
import {
  EXCLUSIVITY_IDS,
  LOCATION_IDS,
  NICHE_IDS,
  PLATFORM_IDS,
  PRODUCTION_IDS,
  TIMELINE_IDS,
  USAGE_DURATION_IDS,
  USAGE_TYPE_IDS,
  getContentType,
  getContentTypes,
  getPlatform,
} from "@/lib/pricing/catalog";
import { PRICING_CONFIG as CFG } from "@/lib/pricing/config";
import { type CalculatorDraft, isUgcDraft } from "@/lib/pricing/draft";
import { estimateViews } from "@/lib/pricing/engine";
import { capitalize, formatPercent } from "@/lib/pricing/format";
import type { PlatformId } from "@/lib/pricing/types";
import {
  currentRateError,
  engagementError,
  engagementWarning,
  followersError,
  viewsError,
  viewsEstimateText,
  viewsWarning,
} from "./steps";

export interface StepProps {
  draft: CalculatorDraft;
  update: (patch: Partial<CalculatorDraft>) => void;
  /** Move on after a tap/click selection on single-choice steps. */
  advance: () => void;
  /** True after the creator tried to continue with an incomplete step. */
  showErrors: boolean;
}

export function StepHeading({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-6 sm:mb-7">
      <h2
        tabIndex={-1}
        data-step-heading
        className="text-[1.65rem] leading-[1.15] font-semibold tracking-tight text-balance text-ink outline-none sm:text-[2rem]"
      >
        {title}
      </h2>
      {subtitle ? <p className="mt-2.5 text-[15.5px] leading-relaxed text-muted text-pretty">{subtitle}</p> : null}
    </div>
  );
}

function FieldLabel({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-[15px] font-semibold text-ink">{children}</p>
      {hint ? <p className="mt-1 text-sm leading-snug text-muted">{hint}</p> : null}
    </div>
  );
}

// 1 ─ Platform ───────────────────────────────────────────────────────────────

export function PlatformStep({ draft, update, advance }: StepProps) {
  return (
    <>
      <StepHeading title="Where will the content run?" subtitle="Pick the platform the brand is paying for." />
      <ChoiceGroup
        label="Platform"
        layout="grid"
        value={draft.platform}
        options={PLATFORM_IDS.map((id) => ({
          value: id,
          label: getPlatform(id).label,
          icon: <PlatformIcon platform={id} size={21} />,
        }))}
        onSelect={(platform, { fromPointer }) => {
          const keepContent = draft.contentType && getContentType(platform, draft.contentType);
          update({ platform, contentType: keepContent ? draft.contentType : null });
          track("platform_selected", { platform });
          if (fromPointer) advance();
        }}
      />
    </>
  );
}

// 2 ─ Content type ───────────────────────────────────────────────────────────

export function ContentStep({ draft, update, advance }: StepProps) {
  const platform = draft.platform as PlatformId;
  const options = getContentTypes(platform);
  const selected = getContentType(platform, draft.contentType);

  return (
    <>
      <StepHeading
        title="What are you creating?"
        subtitle={`Pick the main ${getPlatform(platform).label} deliverable. You can add more pieces at the end.`}
      />
      <ChoiceGroup
        label="Content type"
        value={draft.contentType}
        options={options.map((c) => ({ value: c.id, label: c.label, description: c.description }))}
        onSelect={(contentType, { fromPointer }) => {
          update({ contentType });
          track("content_type_selected", { platform, content_type: contentType });
          const next = getContentType(platform, contentType);
          if (fromPointer && !next?.custom) advance();
        }}
      />
      {selected?.custom ? (
        <div className="mt-5 animate-step-in">
          <label htmlFor="custom-label" className="block text-[15px] font-semibold text-ink">
            What&apos;s the deliverable? <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="custom-label"
            type="text"
            maxLength={CFG.limits.maxCustomLabelLength}
            value={draft.customLabel}
            onChange={(e) => update({ customLabel: e.target.value })}
            placeholder="e.g. Newsletter feature, podcast ad read"
            className="mt-2.5 h-14 w-full rounded-2xl border border-line-strong bg-surface px-4 text-lg text-ink outline-none placeholder:text-faint focus:border-accent focus:shadow-[0_0_0_3px_rgb(91_61_245/0.14)]"
          />
          <p className="mt-2 text-sm text-muted">This only labels your quote. It doesn&apos;t change the price.</p>
        </div>
      ) : null}
    </>
  );
}

// 3 ─ Production effort ──────────────────────────────────────────────────────

export function EffortStep({ draft, update, advance }: StepProps) {
  return (
    <>
      <StepHeading
        title="How much work is involved?"
        subtitle="Your time and production are part of the price. Pick what this deal will actually take."
      />
      <ChoiceGroup
        label="Production effort"
        value={draft.production}
        options={PRODUCTION_IDS.map((id) => ({
          value: id,
          label: CFG.production[id].label,
          description: CFG.production[id].examples.join(" · "),
        }))}
        onSelect={(production, { fromPointer }) => {
          update({ production });
          if (fromPointer) advance();
        }}
      />
    </>
  );
}

// 4 ─ Audience ───────────────────────────────────────────────────────────────

export function AudienceStep({ draft, update, showErrors, advance }: StepProps) {
  const platform = getPlatform(draft.platform as PlatformId);
  const content = getContentType(draft.platform as PlatformId, draft.contentType);
  const noun = content?.viewsNoun ?? "views";
  const estimate = viewsEstimateText(draft);

  return (
    <>
      <StepHeading
        title={`How big is your ${platform.label} audience?`}
        subtitle="Brands care most about how many people will actually see the content."
      />
      <div className="grid gap-7">
        <NumberField
          label={capitalize(platform.audienceNoun)}
          hint="A rough number is fine — “12k” works."
          placeholder="e.g. 10,000"
          value={draft.followers}
          onValueChange={(followers) => update({ followers })}
          error={showErrors ? followersError(draft.followers) : null}
          onEnter={advance}
        />

        <div>
          <NumberField
            label={content?.viewsLabel ?? "Typical views per piece"}
            hint="Use your typical recent performance, not your best-performing post."
            placeholder={draft.viewsUnknown ? "We'll estimate it" : "e.g. 3,000"}
            value={draft.viewsUnknown ? null : draft.views}
            disabled={draft.viewsUnknown}
            onValueChange={(views) => update({ views, viewsUnknown: false })}
            error={showErrors && !draft.viewsUnknown ? viewsError(draft.views) : null}
            warning={!draft.viewsUnknown ? viewsWarning(draft.views, draft.followers) : null}
            onEnter={advance}
          />
          <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 transition-colors hover:border-line-strong has-[:checked]:border-accent has-[:checked]:bg-accent-soft/50">
            <input
              type="checkbox"
              checked={draft.viewsUnknown}
              onChange={(e) => update({ viewsUnknown: e.target.checked })}
              className="mt-0.5 size-5 shrink-0 accent-[var(--color-accent)]"
            />
            <span>
              <span className="block text-[15px] font-medium text-ink">I&apos;m not sure — estimate it from my {platform.audienceNoun}</span>
              {draft.viewsUnknown ? (
                <span className="mt-1 block text-sm text-muted">
                  {estimate ?? `Enter your ${platform.audienceNoun} and we'll estimate your ${noun}.`} Your range will be a little wider.
                </span>
              ) : null}
            </span>
          </label>
        </div>
      </div>
    </>
  );
}

// 5 ─ Engagement ─────────────────────────────────────────────────────────────

const HELPER_FIELDS = [
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "shares", label: "Shares" },
  { key: "saves", label: "Saves" },
] as const;

type HelperKey = (typeof HELPER_FIELDS)[number]["key"];

export function EngagementStep({ draft, update, showErrors, advance }: StepProps) {
  const platformId = draft.platform as PlatformId;
  const platform = getPlatform(platformId);
  const basis = platform.engagement.basis;
  const [helper, setHelper] = useState<Record<HelperKey, number | null>>({
    likes: null,
    comments: null,
    shares: null,
    saves: null,
  });

  const denominator = useMemo(() => {
    if (basis === "followers") return draft.followers ?? 0;
    if (draft.views && !draft.viewsUnknown) return draft.views;
    return estimateViews(platformId, draft.contentType ?? "", draft.followers);
  }, [basis, draft.followers, draft.views, draft.viewsUnknown, draft.contentType, platformId]);

  const interactions = Object.values(helper).reduce<number>((sum, v) => sum + (v ?? 0), 0);
  const computed = denominator > 0 && interactions > 0 ? (interactions / denominator) * 100 : null;
  const computedRounded = computed === null ? null : Number(computed.toFixed(computed < 1 ? 2 : 1));
  const per = basis === "followers" ? platform.audienceNoun : "views";

  return (
    <>
      <StepHeading
        title="How engaged is your audience?"
        subtitle="Engagement shows brands that people don't just scroll past your content."
      />
      <NumberField
        mode="percent"
        label="Engagement rate"
        hint={`Average ${platform.engagement.interactions} per post, divided by ${per}, × 100.`}
        placeholder="e.g. 3.5"
        value={draft.engagementRate}
        onValueChange={(engagementRate) => update({ engagementRate, engagementSkipped: false })}
        error={showErrors ? engagementError(draft.engagementRate) : null}
        warning={engagementWarning(draft)}
        onEnter={advance}
      />

      <details className="group mt-5 rounded-2xl border border-line bg-surface open:shadow-card">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <Sparkle size={17} />
          </span>
          <span className="flex-1">Not sure? We&apos;ll work it out.</span>
          <Plus size={18} className="text-muted transition-transform group-open:rotate-45" />
        </summary>
        <div className="border-t border-line px-4 pt-4 pb-5">
          <p className="text-sm leading-relaxed text-muted">
            Enter the average likes, comments, shares, and saves from a few recent posts. Leave any blank that don&apos;t apply.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {HELPER_FIELDS.map((f) => (
              <NumberField
                key={f.key}
                size="md"
                label={<span className="text-sm">{f.label}</span>}
                placeholder="0"
                value={helper[f.key]}
                onValueChange={(v) => setHelper((h) => ({ ...h, [f.key]: v }))}
              />
            ))}
          </div>
          {denominator <= 0 ? (
            <p className="mt-4 text-sm text-caution">Add your {platform.audienceNoun} on the previous step so we can calculate this.</p>
          ) : computedRounded !== null ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-subtle px-4 py-3">
              <p className="text-[15px] text-ink-soft">
                That&apos;s about <strong className="text-ink">{formatPercent(computedRounded)}</strong>
                <span className="text-muted"> of {per}</span>
              </p>
              <button
                type="button"
                onClick={() => update({ engagementRate: computedRounded, engagementSkipped: false })}
                className="h-10 rounded-full bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-[#262532]"
              >
                Use {formatPercent(computedRounded)}
              </button>
            </div>
          ) : null}
        </div>
      </details>

      <button
        type="button"
        onClick={() => {
          update({ engagementSkipped: true, engagementRate: null });
          advance();
        }}
        className="mt-5 text-[15px] font-medium text-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink"
      >
        Skip — assume typical engagement
      </button>
    </>
  );
}

// 6 ─ Niche ──────────────────────────────────────────────────────────────────

export function NicheStep({ draft, update, advance }: StepProps) {
  return (
    <>
      <StepHeading title="What's your niche?" subtitle="Some categories attract bigger advertising budgets than others." />
      <ChoiceGroup
        label="Niche"
        layout="grid"
        value={draft.niche}
        options={NICHE_IDS.map((id) => ({ value: id, label: CFG.niches[id].label }))}
        onSelect={(niche, { fromPointer }) => {
          update({ niche });
          if (fromPointer) advance();
        }}
      />
    </>
  );
}

// 7 ─ Audience location ──────────────────────────────────────────────────────

export function LocationStep({ draft, update, advance }: StepProps) {
  return (
    <>
      <StepHeading
        title="Where is most of your audience?"
        subtitle="Check your analytics. Advertising costs differ a lot between countries."
      />
      <ChoiceGroup
        label="Audience location"
        value={draft.location}
        options={LOCATION_IDS.map((id) => ({ value: id, label: CFG.locations[id].label }))}
        onSelect={(location, { fromPointer }) => {
          update({ location });
          if (fromPointer) advance();
        }}
      />
    </>
  );
}

// 8 ─ Usage rights ───────────────────────────────────────────────────────────

export function UsageStep({ draft, update, advance, showErrors }: StepProps) {
  const ugc = isUgcDraft(draft);
  const types = USAGE_TYPE_IDS.filter((id) => !(ugc && id === "none"));

  return (
    <>
      <StepHeading
        title={ugc ? "How will the brand use your UGC?" : "Does the brand want to reuse your content?"}
        subtitle="Usage rights are one of the biggest — and most overlooked — parts of a fair price. More rights = more money."
      />
      <ChoiceGroup
        label="Usage rights"
        value={draft.usage}
        options={types.map((id) => ({
          value: id,
          label: CFG.usageTypes[id].label,
          description: CFG.usageTypes[id].description,
        }))}
        onSelect={(usage, { fromPointer }) => {
          update({ usage });
          if (fromPointer && usage === "none") advance();
        }}
      />
      {showErrors && !draft.usage ? (
        <p role="alert" className="mt-3 text-sm text-negative">
          Pick one to continue.
        </p>
      ) : null}
      {draft.usage && draft.usage !== "none" ? (
        <div className="mt-7 animate-step-in">
          <FieldLabel hint="Longer usage is worth more to the brand — so it costs more.">How long?</FieldLabel>
          <ChoiceGroup
            label="Usage duration"
            layout="chips"
            value={draft.usageDuration}
            options={USAGE_DURATION_IDS.map((id) => ({ value: id, label: CFG.usageDurations[id].label }))}
            onSelect={(usageDuration) => update({ usageDuration })}
          />
          {draft.usageDuration === "perpetual" ? (
            <p className="mt-3 text-sm text-caution">Perpetual means forever. Many creators avoid it or charge a big premium.</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

// 9 ─ Remaining deal terms ───────────────────────────────────────────────────

const DELIVERABLE_CHOICES = ["1", "2", "3", "4+"] as const;

export function TermsStep({ draft, update, showErrors, advance }: StepProps) {
  const deliverableChoice = draft.deliverables >= 4 ? "4+" : (String(draft.deliverables) as "1" | "2" | "3");
  const max = CFG.deliverables.max;

  return (
    <>
      <StepHeading title="Last few deal details" subtitle="Exclusivity, volume, and timing all change what's fair." />
      <div className="grid gap-8">
        <div>
          <FieldLabel hint="How long you can't work with competing brands.">Exclusivity</FieldLabel>
          <ChoiceGroup
            label="Exclusivity"
            layout="chips"
            value={draft.exclusivity}
            options={EXCLUSIVITY_IDS.map((id) => ({ value: id, label: CFG.exclusivity[id].label }))}
            onSelect={(exclusivity) => update({ exclusivity })}
          />
        </div>

        <div>
          <FieldLabel>How many deliverables?</FieldLabel>
          <div className="flex flex-wrap items-center gap-3">
            <ChoiceGroup
              label="Number of deliverables"
              layout="chips"
              value={deliverableChoice}
              options={DELIVERABLE_CHOICES.map((v) => ({ value: v, label: v }))}
              onSelect={(v) => update({ deliverables: v === "4+" ? Math.max(4, draft.deliverables) : Number(v) })}
            />
            {deliverableChoice === "4+" ? (
              <div className="flex h-11 items-center rounded-full border border-line-strong bg-surface animate-step-in">
                <button
                  type="button"
                  aria-label="Fewer deliverables"
                  disabled={draft.deliverables <= 4}
                  onClick={() => update({ deliverables: Math.max(4, draft.deliverables - 1) })}
                  className="flex size-11 items-center justify-center rounded-full text-ink-soft disabled:opacity-30"
                >
                  <Minus size={18} />
                </button>
                <span className="min-w-8 text-center text-[15px] font-semibold tabular-nums" aria-live="polite">
                  {draft.deliverables}
                </span>
                <button
                  type="button"
                  aria-label="More deliverables"
                  disabled={draft.deliverables >= max}
                  onClick={() => update({ deliverables: Math.min(max, draft.deliverables + 1) })}
                  className="flex size-11 items-center justify-center rounded-full text-ink-soft disabled:opacity-30"
                >
                  <Plus size={18} />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <FieldLabel>How quickly do they need it?</FieldLabel>
          <ChoiceGroup
            label="Timeline"
            layout="grid"
            columns={2}
            value={draft.timeline}
            options={TIMELINE_IDS.map((id) => ({
              value: id,
              label: CFG.timelines[id].label,
              description: CFG.timelines[id].description,
            }))}
            onSelect={(timeline) => update({ timeline })}
          />
        </div>

        <div className="rounded-2xl border border-dashed border-line-strong p-4 sm:p-5">
          <NumberField
            mode="money"
            size="md"
            label={
              <>
                What do you usually charge for this? <span className="font-normal text-muted">(optional)</span>
              </>
            }
            hint="We'll compare it with your estimate. It never leaves your device."
            placeholder="e.g. 400"
            value={draft.currentRate}
            onValueChange={(currentRate) => update({ currentRate })}
            error={showErrors ? currentRateError(draft.currentRate) : null}
            onEnter={advance}
          />
        </div>
      </div>
    </>
  );
}
