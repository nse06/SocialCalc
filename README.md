# How Much Should I Charge?

A free brand-deal pricing calculator for creators. It answers three questions:
**What should I charge? Why? What should I say to the brand?**

Next.js (App Router, static export) · TypeScript · Tailwind CSS v4. No backend, no database, and no API calls for
pricing: the engine is deterministic code that runs in the browser.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # engine, quote, URL-state and extraction tests (Vitest)
npm run test:e2e   # builds, then runs Playwright on mobile + desktop against the static export
npm run lint
npm run typecheck
npm run build      # static site in out/ — deploy to any static host/CDN
```

## Change the pricing assumptions

Every number lives in **`src/lib/pricing/config.ts`**: planning CPMs, creation fees, default reach, size tiers,
engagement tiers, niche bands, location and effort multipliers, usage/exclusivity/rush fees, range width,
ask/target/floor positions, and rounding. Edit it and the engine, results, quotes, and methodology page all
update. Then run `npm test` (the acceptance scenarios A–F are in `src/lib/pricing/engine.test.ts`).

## Where things are

| Path | What |
| --- | --- |
| `src/lib/pricing/` | `config.ts` (assumptions), `engine.ts` (pure pricing), `draft.ts` (answers + shareable URLs) |
| `src/lib/quote/quote.ts` | Itemized quote (lines always sum to the total) + brand reply |
| `src/components/calculator/` | Multi-step flow (`steps.ts` = order/validation, `step-views.tsx` = UI) |
| `src/components/results/` | Rate card, breakdown, deal adjuster, strategy, quote generator |
| `src/lib/content/landing-pages.ts` | SEO pages: **add an entry to add a page** (route, sitemap, footer links are automatic) |
| `src/lib/features.ts` | Feature flags |
| `src/lib/analytics.ts` | Anonymous events (no PII; numbers are bucketed) |
| `src/lib/deal-extraction/` | Future "paste the brand's email" feature (see below) |

## Configuration (environment variables)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production URL for canonical links, sitemap, OG tags. **Set this before launch.** |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Enables Plausible (cookie-less) analytics. Optional `NEXT_PUBLIC_PLAUSIBLE_SRC`. |
| `NEXT_PUBLIC_ANALYTICS_ENDPOINT` | Alternatively, any endpoint that accepts JSON beacons. |
| `NEXT_PUBLIC_FEATURE_DEAL_PARSER` | `true` shows the "paste the brand's email" box (off by default). |
| `NEXT_PUBLIC_DEAL_EXTRACTION_ENDPOINT` | Future: a serverless LLM extractor returning `ExtractedDealTerms`. |

Tracked events: `calculator_started`, `platform_selected`, `content_type_selected`, `calculator_completed`,
`result_viewed`, `result_adjusted`, `quote_generated`, `quote_copied`, `share_link_copied`.

## Future AI: "Paste the brand's email"

`src/lib/deal-extraction` defines a `DealTermsExtractor` interface that turns a brief into calculator answers
(platform, deliverable, count, usage type and term, exclusivity, deadline). Today it uses a free keyword-based
extractor; pointing `NEXT_PUBLIC_DEAL_EXTRACTION_ENDPOINT` at a small serverless function that asks an LLM for the
same JSON shape swaps it in. Models only extract terms; pricing always stays in the deterministic engine.
