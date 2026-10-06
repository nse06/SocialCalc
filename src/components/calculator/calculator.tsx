"use client";

import dynamic from "next/dynamic";
import { type ComponentType, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "@/components/ui/icons";
import { Results } from "@/components/results/results";
import { audienceBucket, track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { FEATURES } from "@/lib/features";
import {
  type CalculatorDraft,
  type DraftPreset,
  EMPTY_DRAFT,
  dealToSearchParams,
  draftToDeal,
  searchParamsToPreset,
} from "@/lib/pricing/draft";
import {
  AudienceStep,
  ContentStep,
  EffortStep,
  EngagementStep,
  LocationStep,
  NicheStep,
  PlatformStep,
  type StepProps,
  TermsStep,
  UsageStep,
} from "./step-views";
import {
  type StepId,
  applicableSteps,
  firstIncompleteStep,
  isStepComplete,
  isStepId,
  nearestApplicableStep,
  nextStep,
  previousStep,
} from "./steps";

const STEP_VIEWS: Record<StepId, ComponentType<StepProps>> = {
  platform: PlatformStep,
  content: ContentStep,
  effort: EffortStep,
  audience: AudienceStep,
  engagement: EngagementStep,
  niche: NicheStep,
  location: LocationStep,
  usage: UsageStep,
  terms: TermsStep,
};

/** Steps where one tap answers the question (they auto-advance). */
const TAP_STEPS = new Set<StepId>(["platform", "content", "effort", "niche", "location"]);

// Future "paste the brand's email" feature: code-split, only loaded when the flag is on.
const DealEmailImport = dynamic(() => import("./deal-email-import").then((m) => m.DealEmailImport), { ssr: false });

const STORAGE_KEY = "hmsic:calculator:v1";
const AUTO_ADVANCE_MS = 180;

interface SavedProgress {
  source: string;
  draft: CalculatorDraft;
  step: StepId;
}

function readSaved(source: string): SavedProgress | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedProgress;
    return saved?.source === source && isStepId(saved.step) ? saved : null;
  } catch {
    return null;
  }
}

function writeSaved(progress: SavedProgress | null) {
  try {
    if (progress) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode or storage disabled — progress just won't survive a reload.
  }
}

interface CalculatorProps {
  /** Pre-filled answers, e.g. from a landing page. */
  preset?: DraftPreset;
  /** Where the calculator lives, for analytics (e.g. "calculator", "landing:ugc-rate-calculator"). */
  source: string;
  /** Wrap the questions in a card (for embedding in content pages). */
  framed?: boolean;
  className?: string;
}

type HistoryState = { hmsic?: string; hmsicIdx?: number } | null;

export function Calculator({ preset, source, framed = false, className }: CalculatorProps) {
  const initialDraft = useMemo<CalculatorDraft>(() => ({ ...EMPTY_DRAFT, ...preset }), [preset]);
  const initialStep = firstIncompleteStep(initialDraft) ?? "platform";

  const [draft, setDraft] = useState<CalculatorDraft>(initialDraft);
  const [step, setStep] = useState<StepId>(initialStep);
  const [view, setView] = useState<"steps" | "results">("steps");
  const [showErrors, setShowErrors] = useState(false);
  const [resultsKey, setResultsKey] = useState(0);
  const [resultsOrigin, setResultsOrigin] = useState<"flow" | "link">("flow");

  const draftRef = useRef(draft);
  const stepRef = useRef<StepId>(initialStep);
  const historyIdx = useRef(0);
  const started = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const focusOnChange = useRef(false);

  const update = useCallback(
    (patch: Partial<CalculatorDraft>) => {
      const next = { ...draftRef.current, ...patch };
      draftRef.current = next;
      setDraft(next);
      if (!started.current) {
        started.current = true;
        track("calculator_started", { source, preset: preset?.platform ?? preset?.usage ?? "none" });
      }
    },
    [source, preset],
  );

  const showStep = useCallback((id: StepId) => {
    stepRef.current = id;
    focusOnChange.current = true;
    setStep(id);
    setView("steps");
    setShowErrors(false);
  }, []);

  const pushHistory = useCallback((state: string, url?: string) => {
    historyIdx.current += 1;
    window.history.pushState({ hmsic: state, hmsicIdx: historyIdx.current }, "", url);
  }, []);

  const goTo = useCallback(
    (id: StepId) => {
      showStep(id);
      // Steps never carry result params in the URL.
      pushHistory(id, window.location.search ? window.location.pathname : undefined);
    },
    [showStep, pushHistory],
  );

  const complete = useCallback(() => {
    const d = draftRef.current;
    const deal = draftToDeal(d);
    if (!deal) {
      const missing = firstIncompleteStep(d);
      if (missing) goTo(missing);
      return;
    }
    track("calculator_completed", {
      source,
      platform: deal.platform,
      content_type: deal.contentType,
      production: deal.production,
      niche: deal.niche,
      location: deal.location,
      usage: deal.usage,
      usage_duration: deal.usage === "none" ? null : deal.usageDuration,
      exclusivity: deal.exclusivity,
      deliverables: deal.deliverables,
      timeline: deal.timeline,
      audience: audienceBucket(deal.followers),
      views_provided: deal.views !== null,
      engagement_provided: deal.engagementRate !== null,
      current_rate_provided: Boolean(deal.currentRate),
    });
    writeSaved(null);
    focusOnChange.current = true;
    setResultsOrigin("flow");
    setResultsKey((k) => k + 1);
    setView("results");
    pushHistory("results", `${window.location.pathname}?${dealToSearchParams(deal)}`);
  }, [goTo, pushHistory, source]);

  const goNext = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    const d = draftRef.current;
    const current = stepRef.current;
    if (!isStepComplete(d, current)) {
      setShowErrors(true);
      return;
    }
    const next = nextStep(d, current);
    if (next) goTo(next);
    else complete();
  }, [goTo, complete]);

  const advance = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(goNext, AUTO_ADVANCE_MS);
  }, [goNext]);

  const goBack = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (historyIdx.current > 0) {
      window.history.back();
      return;
    }
    const prev = previousStep(draftRef.current, stepRef.current);
    if (prev) {
      showStep(prev);
      window.history.replaceState({ hmsic: prev, hmsicIdx: 0 }, "");
    }
  }, [showStep]);

  const applyExtracted = useCallback(
    (extracted: DraftPreset) => {
      update(extracted);
      const next = firstIncompleteStep(draftRef.current);
      if (next) goTo(next);
      else complete();
    },
    [update, goTo, complete],
  );

  const editAnswers = useCallback(() => goTo(applicableSteps(draftRef.current)[0] ?? "platform"), [goTo]);

  const startOver = useCallback(() => {
    const fresh = { ...initialDraft };
    draftRef.current = fresh;
    setDraft(fresh);
    writeSaved(null);
    goTo(firstIncompleteStep(fresh) ?? "platform");
    rootRef.current?.scrollIntoView({ block: "start" });
  }, [goTo, initialDraft]);

  // On mount: a shared result link, saved progress, or a fresh start.
  useEffect(() => {
    const fromUrl = searchParamsToPreset(new URLSearchParams(window.location.search));
    let nextDraft = draftRef.current;
    let nextStepId = stepRef.current;
    let nextView: "steps" | "results" = "steps";

    if (Object.keys(fromUrl).length > 0) {
      nextDraft = { ...initialDraft, ...fromUrl };
      if (draftToDeal(nextDraft)) nextView = "results";
      else nextStepId = firstIncompleteStep(nextDraft) ?? "platform";
    } else {
      const saved = readSaved(source);
      if (saved) {
        nextDraft = { ...EMPTY_DRAFT, ...saved.draft };
        nextStepId = applicableSteps(nextDraft).includes(saved.step)
          ? saved.step
          : (firstIncompleteStep(nextDraft) ?? "platform");
      }
    }

    draftRef.current = nextDraft;
    stepRef.current = nextStepId;
    // Syncing from external state (URL / sessionStorage) after hydration.
    setDraft(nextDraft);
    setStep(nextStepId);
    setView(nextView);
    if (nextView === "results") {
      setResultsOrigin("link");
      setResultsKey((k) => k + 1);
    }

    // Keep Next.js's own history state; just tag this entry.
    const state = (window.history.state ?? {}) as Record<string, unknown>;
    window.history.replaceState({ ...state, hmsic: nextView === "results" ? "results" : nextStepId, hmsicIdx: 0 }, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // Browser back/forward moves between steps instead of leaving the page.
  useEffect(() => {
    function onPopState(event: PopStateEvent) {
      const state = event.state as HistoryState;
      historyIdx.current = state?.hmsicIdx ?? 0;
      const target = state?.hmsic;
      if (target === "results" && draftToDeal(draftRef.current)) {
        focusOnChange.current = true;
        setView("results");
      } else if (isStepId(target)) {
        showStep(nearestApplicableStep(draftRef.current, target));
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [showStep]);

  // Save progress so switching apps (e.g. to check your analytics) doesn't lose answers.
  useEffect(() => {
    if (view === "steps" && started.current) writeSaved({ source, draft, step });
  }, [draft, step, view, source]);

  // Move focus + scroll to the new step for keyboard, screen reader, and mobile users.
  useEffect(() => {
    if (!focusOnChange.current) return;
    focusOnChange.current = false;
    const root = rootRef.current;
    if (!root) return;
    if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: "start" });
    const heading = root.querySelector<HTMLElement>("[data-step-heading]");
    heading?.focus({ preventScroll: true });
  }, [step, view]);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );

  const handleResultsChange = useCallback(
    (patch: Partial<CalculatorDraft>) => {
      const next = { ...draftRef.current, ...patch };
      draftRef.current = next;
      setDraft(next);
      const deal = draftToDeal(next);
      if (deal) {
        window.history.replaceState(
          { hmsic: "results", hmsicIdx: historyIdx.current },
          "",
          `${window.location.pathname}?${dealToSearchParams(deal)}`,
        );
      }
    },
    [],
  );

  if (view === "results") {
    return (
      <div ref={rootRef} className={cn("scroll-mt-20", className)}>
        <Results
          key={resultsKey}
          draft={draft}
          origin={resultsOrigin}
          source={source}
          onChange={handleResultsChange}
          onEditAnswers={editAnswers}
          onStartOver={startOver}
        />
      </div>
    );
  }

  const steps = applicableSteps(draft);
  const index = Math.max(0, steps.indexOf(step));
  const StepView = STEP_VIEWS[step];
  const complete_ = isStepComplete(draft, step);
  const isTapStep = TAP_STEPS.has(step);
  const isLast = index === steps.length - 1;
  const canGoBack = index > 0;
  const progress = Math.round(((index + (complete_ ? 1 : 0.35)) / steps.length) * 100);

  return (
    <div
      ref={rootRef}
      className={cn(
        "scroll-mt-20",
        framed && "rounded-[28px] border border-line bg-surface p-5 shadow-card sm:p-8",
        className,
      )}
    >
      <div className="mb-7 flex items-center gap-3 sm:mb-9">
        <button
          type="button"
          onClick={goBack}
          disabled={!canGoBack}
          aria-label="Previous question"
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-colors hover:border-line-strong hover:text-ink disabled:invisible"
        >
          <ArrowLeft size={18} />
        </button>
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-label="Calculator progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-[#8b6cff] transition-[width] duration-500 ease-[var(--ease-out-soft)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="w-12 shrink-0 text-right text-sm text-muted tabular-nums">
          {index + 1}/{steps.length}
        </span>
      </div>

      <div key={step} className="animate-step-in">
        {FEATURES.dealEmailParser && step === "platform" ? <DealEmailImport onApply={applyExtracted} /> : null}
        <StepView draft={draft} update={update} advance={advance} showErrors={showErrors} />
      </div>

      <div
        className={cn(
          "sticky bottom-0 z-10 mt-8 border-t border-line pt-3 pb-safe backdrop-blur-md",
          framed ? "-mx-5 -mb-5 rounded-b-[28px] bg-surface/90 px-5" : "-mx-4 bg-canvas/90 px-4",
          "sm:static sm:mx-0 sm:mt-10 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none",
          isTapStep && !complete_ && "hidden",
        )}
      >
        <Button
          variant={isLast ? "accent" : "primary"}
          size="lg"
          className="w-full sm:w-auto sm:min-w-48"
          onClick={goNext}
          disabled={isTapStep && !complete_}
        >
          {isLast ? "See my rate" : "Continue"}
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}
