import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CtaBand } from "@/components/marketing/cta-band";
import { UsageTable } from "@/components/marketing/usage-table";
import {
  EXCLUSIVITY_IDS,
  LOCATION_IDS,
  NICHE_IDS,
  PLATFORM_IDS,
  PRODUCTION_IDS,
  TIMELINE_IDS,
  getNiche,
  getPlatform,
} from "@/lib/pricing/catalog";
import { PRICING_CONFIG as CFG } from "@/lib/pricing/config";
import { formatMoney } from "@/lib/pricing/format";

export const metadata: Metadata = {
  title: "Methodology: How We Calculate Creator Rates",
  description:
    "Every assumption behind the brand deal calculator: expected reach, planning prices per 1,000 views, creation fees, engagement, niche, location, usage rights, exclusivity, and rush fees.",
  alternates: { canonical: "/methodology" },
};

const pct = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(Math.round(n * 100))}%`;
const mult = (m: number) => (m === 1 ? "Baseline" : pct(m - 1));

function Table({ head, rows, caption }: { head: string[]; rows: ReactNode[][]; caption?: string }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[20rem] text-left text-[14.5px]">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="bg-subtle text-[12.5px] text-muted">
          <tr>
            {head.map((h, i) => (
              <th key={h} scope="col" className={`px-4 py-2.5 font-medium ${i > 0 ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className="px-4 py-2.5 font-medium text-ink">
                    {cell}
                  </th>
                ) : (
                  <td key={i} className="px-4 py-2.5 text-right text-ink-soft tabular-nums">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{title}</h2>
      <div className="mt-4 grid gap-4 text-[16px] leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

const FACTORS = [
  "Expected reach",
  "Audience quality",
  "Engagement",
  "Platform",
  "Deliverables",
  "Production effort",
  "Usage rights",
  "Exclusivity",
  "Niche",
  "Geography",
  "Timing",
  "Negotiation",
];

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 sm:pt-16">
      <p className="text-[13px] font-semibold tracking-[0.08em] text-accent uppercase">Methodology</p>
      <h1 className="mt-3 text-[2.3rem] leading-[1.05] font-semibold tracking-[-0.035em] text-balance sm:text-5xl">
        How we calculate your rate
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-soft">
        There is no single correct price for creator content. Rates vary enormously between creators, brands, and deals.
        This calculator is a <strong className="font-semibold text-ink">planning and negotiation tool</strong>: it turns a
        set of transparent, editable assumptions into a reasonable starting point — not a guaranteed market-clearing
        price.
      </p>

      <div className="mt-12 grid gap-14">
        <Section id="factors" title="What moves a creator's rate">
          <p>Follower count is a starting signal, not the answer. Rates depend on:</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {FACTORS.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[15.5px]">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                {f}
              </li>
            ))}
          </ul>
          <p>
            The calculator models the first eleven. The last one — negotiation — is up to you, which is why results include a
            recommended strategy and not just a number.
          </p>
        </Section>

        <Section id="formula" title="The short version">
          <div className="rounded-2xl bg-night p-5 font-mono text-[13.5px] leading-7 text-[#e4e2f3] sm:p-6">
            <p>audience value = expected views ÷ 1,000 × planning price</p>
            <p>base = audience value + content creation fee</p>
            <p>per piece = base × engagement × location × niche × effort</p>
            <p>content fee = per piece × deliverables</p>
            <p>total = content fee + usage + exclusivity + rush</p>
          </div>
          <p>
            The total becomes the middle of your range. Every step shows up in the “What&apos;s driving your rate?” breakdown on
            your results.
          </p>
        </Section>

        <Section id="reach" title="1. Expected reach">
          <p>
            Brands are paying for attention, so we start from how many people will realistically see the content. Your
            typical recent views are the best input — use what your posts usually get, not your best one.
          </p>
          <p>
            If you don&apos;t know your views, we estimate them as a share of your followers. The share depends on the format
            and shrinks for larger accounts, which usually reach a smaller fraction of their audience. Estimated views widen
            your range.
          </p>
          <Table
            caption="Account size adjustments"
            head={["Account size", "Reach estimate", "“Typical” engagement"]}
            rows={CFG.sizeTiers.map((t) => [t.label, `× ${t.reachFactor}`, `× ${t.engagementBenchmarkFactor}`])}
          />
        </Section>

        <Section id="prices" title="2. Planning prices and creation fees">
          <p>
            Each format has a planning price per 1,000 expected views and a content creation fee. The creation fee pays for
            the work itself, so smaller creators aren&apos;t priced at nearly zero — the same logic that makes UGC a paid
            service. UGC is priced on the creation fee and usage only, because it isn&apos;t posted to your audience.
          </p>
          <p>“Default reach” is the share of followers (subscribers on YouTube) we assume see a typical piece when you
            don&apos;t enter your views, before the account-size adjustment above.</p>
          {PLATFORM_IDS.map((id) => {
            const platform = getPlatform(id);
            return (
              <div key={id}>
                <h3 className="mt-2 text-[17px] font-semibold text-ink">{platform.label}</h3>
                <Table
                  caption={`${platform.label} planning prices`}
                  head={["Format", "Per 1,000 views", "Creation fee", "Default reach"]}
                  rows={platform.contentTypes.map((c) => [
                    c.label,
                    c.ugc ? "—" : formatMoney(c.cpm),
                    formatMoney(c.creationFee),
                    c.ugc ? "—" : `${Math.round(c.reachRate * 100)}%`,
                  ])}
                />
              </div>
            );
          })}
        </Section>

        <Section id="engagement" title="3. Engagement">
          <p>
            We compare your engagement rate with a typical rate for your platform. Instagram, X, LinkedIn, and Twitch are
            measured against followers (and adjusted for account size, since smaller accounts naturally engage more). TikTok
            and YouTube are measured against views. The effect is deliberately coarse and capped — engagement is a quality
            signal, not a price on its own.
          </p>
          <Table
            caption="Typical engagement by platform"
            head={["Platform", "Measured against", "Typical rate"]}
            rows={PLATFORM_IDS.map((id) => {
              const p = getPlatform(id);
              return [p.label, p.engagement.basis === "views" ? "Views" : p.audienceNoun[0].toUpperCase() + p.audienceNoun.slice(1), `${p.engagement.benchmark}%`];
            })}
          />
          <Table
            caption="Engagement adjustment"
            head={["Your rate vs. typical", "Adjustment"]}
            rows={CFG.engagementTiers.map((t, i, all) => {
              const from = i === 0 ? 0 : all[i - 1].belowRatio;
              const range = Number.isFinite(t.belowRatio) ? `${from}× – ${t.belowRatio}×` : `${from}× or more`;
              return [`${t.label} (${range})`, mult(t.multiplier)];
            })}
          />
        </Section>

        <Section id="adjustments" title="4. Niche, audience location, and effort">
          <p>
            Advertisers pay different prices to reach different audiences. Rather than claim a precise multiplier for every
            niche, we group niches into broad demand bands.
          </p>
          <Table
            caption="Niche bands"
            head={["Niche", "Adjustment"]}
            rows={NICHE_IDS.map((id) => {
              const n = getNiche(id);
              return [n.label, mult(n.multiplier)];
            })}
          />
          <Table
            caption="Audience location"
            head={["Audience location", "Adjustment"]}
            rows={LOCATION_IDS.map((id) => [CFG.locations[id].label, mult(CFG.locations[id].multiplier)])}
          />
          <Table
            caption="Production effort"
            head={["Production effort", "Adjustment"]}
            rows={PRODUCTION_IDS.map((id) => [CFG.production[id].label, mult(CFG.production[id].multiplier)])}
          />
        </Section>

        <Section id="terms" title="5. Deal terms">
          <p>
            Commercial terms are added as fees on top of the content fee. This is where many creators undercharge: when a
            brand wants to reuse your content, run it as an ad, or keep you away from competitors, they&apos;re getting more
            — and should pay more.
          </p>
          <UsageTable />
          <Table
            caption="Exclusivity"
            head={["Exclusivity", "Fee"]}
            rows={EXCLUSIVITY_IDS.map((id) => [CFG.exclusivity[id].label, CFG.exclusivity[id].fee ? pct(CFG.exclusivity[id].fee) : "—"])}
          />
          <Table
            caption="Timeline"
            head={["Timeline", "Rush fee"]}
            rows={TIMELINE_IDS.map((id) => [CFG.timelines[id].label, CFG.timelines[id].fee ? pct(CFG.timelines[id].fee) : "—"])}
          />
          <p>
            Extra deliverables are priced at {Math.round(CFG.deliverables.additionalPieceFactor * 100)}% of the first piece
            each — a small discount for a bigger commitment.
          </p>
        </Section>

        <Section id="range" title="6. From a number to a range">
          <p>
            The total is the middle of your range. The range is ±{Math.round(CFG.range.baseSpread * 100)}% when you give us
            real numbers, and wider (up to ±{Math.round(CFG.range.maxSpread * 100)}%) when we had to estimate your views or
            engagement, or when an input is unusual — very small or very large accounts, views far above or below your
            followers, or unusually high engagement.
          </p>
          <p>
            Your <strong className="font-semibold text-ink">recommended starting ask</strong> sits in the upper half of the
            range, so you have room to negotiate. The <strong className="font-semibold text-ink">comfortable target</strong>{" "}
            is a little below the middle, and the <strong className="font-semibold text-ink">walk-away floor</strong> is just
            below the range. Prices are rounded to numbers people actually quote — no {formatMoney(1037)}.42.
          </p>
        </Section>

        <Section id="limits" title="What the calculator can't know">
          <ul className="grid gap-2.5">
            {[
              "The brand's actual budget, and how badly they want you specifically.",
              "Your track record — past results, case studies, and testimonials.",
              "Seasonality and demand: Q4 budgets are not March budgets.",
              "Your relationship with the brand, and long-term deal potential.",
              "Contract details like payment terms, revisions, and kill fees.",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="mt-[0.65em] size-1.5 shrink-0 rounded-full bg-line-strong" />
                {item}
              </li>
            ))}
          </ul>
          <p>
            Use the result as a reasoned starting point, then apply your judgment. None of this is financial, legal, or tax
            advice.
          </p>
          <p className="text-[14px] text-muted">Assumptions version {CFG.version}.</p>
        </Section>
      </div>

      <div className="mt-20">
        <CtaBand title="See what your next deal is worth." />
      </div>
    </div>
  );
}
