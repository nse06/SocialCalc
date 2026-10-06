import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import {
  ArrowRight,
  Clapper,
  Eye,
  FileText,
  Globe,
  Heart,
  Layers,
  Lock,
  MessageSquare,
  PlatformIcon,
  Tag,
  Target,
  Wand,
} from "@/components/ui/icons";
import { roundForDisplay } from "@/components/results/helpers";
import { PRICING_CONFIG } from "@/lib/pricing/config";
import { calculateRate } from "@/lib/pricing/engine";
import { formatMoney, formatSignedMoney, formatSignedPercent } from "@/lib/pricing/format";
import type { DealInputs, PlatformId } from "@/lib/pricing/types";

/** A realistic example deal, priced by the real engine at build time. */
const SAMPLE_DEAL: DealInputs = {
  platform: "instagram",
  contentType: "reel",
  production: "standard",
  followers: 25_000,
  views: 9_000,
  engagementRate: 3.5,
  niche: "beauty",
  location: "us-ca",
  usage: "paid",
  usageDuration: "30d",
  exclusivity: "none",
  deliverables: 1,
  timeline: "normal",
};

const QUICK_STARTS: { label: string; href: string; platform: PlatformId }[] = [
  { label: "Instagram", href: "/calculator?p=instagram", platform: "instagram" },
  { label: "TikTok", href: "/calculator?p=tiktok", platform: "tiktok" },
  { label: "YouTube", href: "/calculator?p=youtube", platform: "youtube" },
  { label: "UGC", href: "/calculator?p=tiktok&c=ugc", platform: "other" },
];

function HeroPreview() {
  const r = calculateRate(SAMPLE_DEAL);
  const suffix: Partial<Record<string, string>> = {
    engagement: r.engagement.label.toLowerCase(),
    niche: PRICING_CONFIG.niches[SAMPLE_DEAL.niche].label,
    usage: "30-day paid ads",
  };
  const rows = r.lines
    .filter((line) => line.kind === "base" || line.active)
    .map((line) => ({
      label: suffix[line.id] ? `${line.label} · ${suffix[line.id]}` : line.label,
      value:
        line.kind === "adjustment"
          ? formatSignedPercent(line.percent ?? 0)
          : line.kind === "base"
            ? formatMoney(roundForDisplay(line.amount))
            : formatSignedMoney(roundForDisplay(line.amount)),
    }));
  return (
    <figure className="relative mx-auto mt-14 w-full max-w-md lg:mt-0">
      <div
        aria-hidden="true"
        className="absolute -inset-6 -z-10 rounded-[40px] bg-[radial-gradient(closest-side,rgb(124_92_255/0.28),transparent)] blur-xl"
      />
      <div className="relative isolate overflow-hidden rounded-[28px] bg-night p-6 text-white shadow-lift sm:p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-20 -z-10 size-80 rounded-full bg-[radial-gradient(closest-side,rgb(124_92_255/0.55),transparent)]"
        />
        <div className="flex items-center justify-between text-[13px] text-night-muted">
          <span>Your estimated rate</span>
          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11.5px]">Example</span>
        </div>
        <p className="mt-2 text-[2.6rem] leading-none font-semibold tracking-[-0.035em] sm:text-5xl">
          {formatMoney(r.low)}
          <span className="text-night-muted">–</span>
          {formatMoney(r.high)}
        </p>
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
          <span className="text-[14px] text-night-muted">Recommended starting ask</span>
          <span className="text-2xl font-semibold">{formatMoney(r.ask)}</span>
        </div>
        <ul className="mt-5 grid gap-2.5 border-t border-white/10 pt-4 text-[13.5px]">
          {rows.map((row) => (
            <li key={row.label} className="flex justify-between gap-4">
              <span className="text-night-muted">{row.label}</span>
              <span className="font-medium">{row.value}</span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mt-4 text-center text-[13px] text-muted">
        Example: 25K-follower beauty creator, one Instagram Reel, 30 days of paid usage.
      </figcaption>
    </figure>
  );
}

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 h-[720px] bg-[radial-gradient(60%_50%_at_50%_0%,rgb(124_92_255/0.16),transparent)]"
      />
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-20 sm:px-6 sm:pt-20 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16 lg:pt-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-ink-soft shadow-card">
            <span className="size-1.5 rounded-full bg-positive" aria-hidden="true" />
            Free · No sign-up · About a minute
          </p>
          <h1 className="mt-6 text-[2.55rem] leading-[1.03] font-semibold tracking-[-0.04em] text-balance text-ink sm:text-6xl lg:text-[4.25rem]">
            How much should you{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10">charge</span>
              <span
                aria-hidden="true"
                className="absolute inset-x-[-0.06em] bottom-[0.06em] z-0 h-[0.32em] rounded-full bg-[#ddd5ff]"
              />
            </span>{" "}
            for a brand deal?
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft text-pretty sm:text-xl">
            Get a fair starting price for your next sponsored post, Reel, TikTok, YouTube integration, or UGC deal.
          </p>
          <p className="mt-3 text-lg font-medium text-ink">Stop guessing what your content is worth.</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <ButtonLink href="/calculator" variant="accent" size="lg" className="text-[17px]">
              Calculate My Rate
              <ArrowRight size={19} />
            </ButtonLink>
            <span className="text-sm text-muted">No account required.</span>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[13px] text-muted">Jump straight in:</span>
            {QUICK_STARTS.map((q) => (
              <Link
                key={q.label}
                href={q.href}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
              >
                <PlatformIcon platform={q.platform} size={15} />
                {q.label}
              </Link>
            ))}
          </div>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}

export function FlowVisual() {
  const r = calculateRate(SAMPLE_DEAL);
  const steps = [
    {
      title: "Creator inputs",
      icon: <Eye size={18} />,
      items: ["Platform & format", "Followers & typical views", "Engagement", "Niche & audience location"],
    },
    {
      title: "Deal terms",
      icon: <FileText size={18} />,
      items: ["Usage rights & duration", "Exclusivity", "Number of deliverables", "Timeline"],
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6" aria-labelledby="how-heading">
      <p className="text-[13px] font-semibold tracking-[0.08em] text-accent uppercase">How it works</p>
      <h2 id="how-heading" className="mt-2 max-w-2xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
        From your numbers to a quote you can send.
      </h2>
      <ol className="mt-10 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {steps.map((step, i) => (
          <li key={step.title} className="contents">
            <div className="rounded-[24px] border border-line bg-surface p-6 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent">{step.icon}</span>
                <p className="text-[13px] font-medium text-muted">Step {i + 1}</p>
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">{step.title}</h3>
              <ul className="mt-3 grid gap-2 text-[15px] text-ink-soft">
                {step.items.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span className="size-1.5 rounded-full bg-line-strong" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-center py-1 text-faint lg:px-1" aria-hidden="true">
              <ArrowRight size={22} className="rotate-90 lg:rotate-0" />
            </div>
          </li>
        ))}
        <li className="rounded-[24px] bg-night p-6 text-white shadow-lift">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-[#b9a8ff]">
              <Target size={18} />
            </span>
            <p className="text-[13px] font-medium text-night-muted">Step 3</p>
          </div>
          <h3 className="mt-4 text-xl font-semibold tracking-tight">Recommended rate</h3>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(r.low)}–{formatMoney(r.high)}
          </p>
          <p className="mt-1 text-[15px] text-night-muted">
            Ask <span className="font-semibold text-white">{formatMoney(r.ask)}</span> · itemized quote · brand reply
          </p>
        </li>
      </ol>
    </section>
  );
}

const FACTORS = [
  { icon: <Eye size={19} />, title: "Average views", body: "Brands pay for people who actually see the content — not followers who never will." },
  { icon: <Heart size={19} />, title: "Engagement", body: "An engaged audience is worth more than a big, quiet one." },
  { icon: <Clapper size={19} />, title: "Content type", body: "A dedicated YouTube video isn't priced like a Story." },
  { icon: <Wand size={19} />, title: "Production effort", body: "Scripts, locations, and editing take real time." },
  { icon: <Layers size={19} />, title: "Usage rights", body: "Ads and reposts are extra value for the brand — and extra money for you." },
  { icon: <Lock size={19} />, title: "Exclusivity", body: "Saying no to competitors costs you future deals." },
  { icon: <Globe size={19} />, title: "Audience", body: "Advertising prices differ a lot between countries." },
  { icon: <Tag size={19} />, title: "Niche", body: "Finance, B2B, and tech audiences tend to command more." },
];

export function FactorGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6" aria-labelledby="factors-heading">
      <h2 id="factors-heading" className="max-w-2xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
        Your follower count isn&apos;t the whole story.
      </h2>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">Your rate can change based on:</p>
      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FACTORS.map((f) => (
          <li key={f.title} className="rounded-[22px] border border-line bg-surface p-5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-subtle text-ink">{f.icon}</span>
            <h3 className="mt-4 text-[16.5px] font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{f.body}</p>
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <ButtonLink href="/calculator" variant="primary" size="lg">
          Calculate my rate
          <ArrowRight size={18} />
        </ButtonLink>
      </div>
    </section>
  );
}

const USAGE_EXAMPLE_BASE: DealInputs = {
  platform: "tiktok",
  contentType: "sponsored",
  production: "standard",
  followers: 40_000,
  views: 15_000,
  engagementRate: 6,
  niche: "general",
  location: "us-ca",
  usage: "none",
  usageDuration: "30d",
  exclusivity: "none",
  deliverables: 1,
  timeline: "normal",
};

const USAGE_SCENARIOS: { label: string; patch: Partial<DealInputs> }[] = [
  { label: "Posted on your account only", patch: { usage: "none" } },
  { label: "30 days of organic reuse", patch: { usage: "organic", usageDuration: "30d" } },
  { label: "90 days of paid ads", patch: { usage: "paid", usageDuration: "90d" } },
  { label: "90 days of Spark Ads (whitelisting)", patch: { usage: "whitelisting", usageDuration: "90d" } },
  { label: "12-month full buyout", patch: { usage: "buyout", usageDuration: "12m" } },
];

export function UsageExample() {
  const rows = USAGE_SCENARIOS.map((s) => ({ ...s, ask: calculateRate({ ...USAGE_EXAMPLE_BASE, ...s.patch }).ask }));
  const max = Math.max(...rows.map((r) => r.ask));
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6" aria-labelledby="usage-heading">
      <div className="grid gap-10 rounded-[32px] border border-line bg-surface p-6 shadow-card sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-[13px] font-semibold tracking-[0.08em] text-accent uppercase">More rights = more money</p>
          <h2 id="usage-heading" className="mt-2 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            Same creator. Same video. Different deal.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">
            Usage rights are one of the most overlooked parts of a creator&apos;s rate. When a brand wants to run your content
            as an ad — or own it outright — they&apos;re getting more value. Your price should reflect that.
          </p>
          <Link
            href="/usage-rights-calculator"
            className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-semibold text-accent underline-offset-4 hover:underline"
          >
            How to price usage rights <ArrowRight size={16} />
          </Link>
        </div>
        <figure>
          <ul className="grid gap-4">
            {rows.map((row) => (
              <li key={row.label}>
                <div className="flex items-baseline justify-between gap-3 text-[14.5px]">
                  <span className="text-ink-soft">{row.label}</span>
                  <span className="font-semibold text-ink tabular-nums">{formatMoney(row.ask)}</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-subtle" aria-hidden="true">
                  <div className="h-full rounded-r-[4px] rounded-l-full bg-accent" style={{ width: `${(row.ask / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <figcaption className="mt-5 text-[13px] text-muted">
            Recommended starting ask for one sponsored TikTok from a 40K-follower creator with 15K typical views.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

const QUESTIONS = [
  {
    icon: <Target size={19} />,
    q: "What should I charge?",
    a: "A fair range, a recommended starting ask, a comfortable target, and a walk-away floor.",
  },
  {
    icon: <Layers size={19} />,
    q: "Why?",
    a: "A clear breakdown of reach, effort, and deal terms — so you can explain your number with confidence.",
  },
  {
    icon: <MessageSquare size={19} />,
    q: "What should I say?",
    a: "An itemized quote and a short, friendly reply you can paste straight into an email or DM.",
  },
];

export function ThreeQuestions() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6" aria-labelledby="questions-heading">
      <h2 id="questions-heading" className="max-w-2xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
        Three answers before you hit reply.
      </h2>
      <ul className="mt-10 grid gap-3 md:grid-cols-3">
        {QUESTIONS.map((item, i) => (
          <li key={item.q} className="rounded-[24px] border border-line bg-surface p-6">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">{item.icon}</span>
              <span className="text-[13px] font-semibold text-faint tabular-nums">0{i + 1}</span>
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">{item.q}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{item.a}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
