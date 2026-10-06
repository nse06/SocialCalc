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
npm run test:e2e   # builds, then runs Playwright + axe on mobile and desktop against the static export
npm run lint
npm run typecheck
npm run build      # static site in out/ — deploy to any static host/CDN
```

The E2E suite (`e2e/`) covers the full flow and quote copy, usage and current-rate scenarios, UGC, shared
links, browser back, keyboard-only use, input validation, landing-page presets, and WCAG 2.1 AA checks with axe.
CI (`.github/workflows/ci.yml`) runs lint, unit tests, and the E2E suite on pull requests.

## Deploy

`npm run build` writes a fully static site to `out/` — no server needed.

- **Cloudflare Pages** (recommended): connect the repo, build command `npm run build`, output directory `out`.
  Pages also deploys `functions/` automatically, which is where the optional profile-lookup endpoint lives.
  Free tier, commercial use allowed.
- **Vercel / Netlify**: build command `npm run build`, publish directory `out`. The site works; the profile lookup
  needs `functions/api/profile.ts` ported to that host's functions format.
- **Anything else** (S3 + CloudFront, nginx…): serve `out/`, mapping `/path` to `/path.html`.

Set `NEXT_PUBLIC_SITE_URL` (see below) in the build environment.

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
| `src/lib/lookup/` + `functions/api/profile.ts` | Profile lookup by handle: YouTube adapter, endpoint, browser client (see below) |

## Configuration (environment variables)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production URL for canonical links, sitemap, OG tags. **Set this before launch.** |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Enables Plausible (cookie-less) analytics. Optional `NEXT_PUBLIC_PLAUSIBLE_SRC`. |
| `NEXT_PUBLIC_ANALYTICS_ENDPOINT` | Alternatively, any endpoint that accepts JSON beacons. |
| `NEXT_PUBLIC_ADSTERRA_KEY_300X250` / `NEXT_PUBLIC_ADSTERRA_KEY_728X90` | Adsterra banner keys (phone / desktop). Ads stay off until set. Optional `NEXT_PUBLIC_ADSTERRA_HOST` if your snippet's `invoke.js` host differs. |
| `NEXT_PUBLIC_FEATURE_DEAL_PARSER` | `true` shows the "paste the brand's email" box (off by default). |
| `NEXT_PUBLIC_DEAL_EXTRACTION_ENDPOINT` | Future: a serverless LLM extractor returning `ExtractedDealTerms`. |
| `NEXT_PUBLIC_FEATURE_PROFILE_LOOKUP` | `true` shows "Fill this in from your channel" (off by default — see Profile lookup). |
| `NEXT_PUBLIC_PROFILE_LOOKUP_ENDPOINT` | Lookup endpoint if not the default `/api/profile`. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact shown on the privacy and terms pages (platform API reviews expect one). |
| `YOUTUBE_API_KEY` | **Server-side secret** for `functions/api/profile.ts`. Set it as an encrypted variable in Cloudflare Pages — never as `NEXT_PUBLIC_*`. |

Tracked events: `calculator_started`, `platform_selected`, `content_type_selected`, `calculator_completed`,
`result_viewed`, `result_adjusted`, `quote_generated`, `quote_copied`, `share_link_copied`, `deal_email_parsed`,
`profile_lookup`, `template_copied`.

## Profile lookup (YouTube)

A creator types `@handle` or pastes a channel link and the audience step fills in itself: subscribers, plus typical
views and engagement for the format they're pricing (long-form or Shorts). Typical = the median of up to 15 recent
videos that are 7–180 days old, so one viral hit doesn't skew it; engagement = (likes + comments) ÷ views.

**Policy gate — read before turning it on.** YouTube's Developer Policies (III.E.4.h) forbid using API data to
create derived metrics such as an engagement rate or a sponsorship price. Since June 2026 the derived-metrics
amendment (III.L) allows exactly this use case for approved developers. Before enabling the lookup in production:

1. Launch the site on its real domain with the privacy page, terms page and `NEXT_PUBLIC_CONTACT_EMAIL` in place.
   With the flag on, both pages gain the YouTube API Services sections the policies require.
2. Add the official YouTube logo next to the "Data from YouTube" link on the lookup card
   (`src/components/calculator/profile-lookup.tsx`) — download it from YouTube's brand resources; don't redraw it.
3. Apply through the YouTube API quota extension / audit form ("Section 5" → "Analytics & Reporting"),
   describing the creator-side rate calculator, and wait for approval.

The rest is built in: the endpoint keeps the API key server-side; the card separates YouTube's numbers from our
calculations, labels the Shorts/long-form split as ours, and shows when the data was fetched; YouTube results say
they aren't endorsed by YouTube or Google; analytics never include the handle.

**Set up**

1. Google Cloud console → new project → enable **YouTube Data API v3** → create an API key, restricted to that API.
2. Cloudflare Pages → Settings → Variables: add `YOUTUBE_API_KEY` (encrypted) and
   `NEXT_PUBLIC_FEATURE_PROFILE_LOOKUP=true`, then redeploy.
3. Security → WAF → add a rate-limiting rule for `/api/profile` (e.g. 20 requests per minute per IP) so nobody can
   burn the quota.
4. To try it locally: `NEXT_PUBLIC_FEATURE_PROFILE_LOOKUP=true npm run build`, put `YOUTUBE_API_KEY=…` in
   `.dev.vars`, then `npx wrangler pages dev out`.

**Quota.** Each uncached lookup costs 3 units (channels, playlistItems, videos) of the default 10,000 a day, so
about 3,300 fresh lookups a day. Results are cached at the edge for 12 hours per channel and misses for 10 minutes.
When the quota runs out, the card says lookup is unavailable and the manual fields work as usual.

**Next platforms.** The endpoint and `ProfileStats` already model Instagram (`reel`/`post`) and TikTok (`video`):

- **Instagram**: Business Discovery in the Instagram Graph API (our own Meta app + app review) returns followers
  and per-post likes, comments and views for public business/creator accounts — no reach.
- **TikTok**: the Display API needs each creator to log in with TikTok (`user.info.stats`, `video.list`).
- **Or** a paid aggregator (e.g. Phyllo) covering both behind one API.

Each platform's developer terms need the same review as YouTube's before shipping.

## Ads

Ads appear only on content pages (landing-page articles and the methodology page) — never inside the calculator,
next to a result, in the quote, or as pop-ups. Each unit runs in a sandboxed frame without same-origin access, so
ad scripts can't read the page or a creator's saved answers. Placements live in `src/lib/ads.ts`
(`AD_PLACEMENTS`); the slot component is `src/components/ads/ad-slot.tsx`. After adding real keys, confirm ads
render on a deployed page — if Adsterra refuses to serve inside a sandboxed frame, relax the `sandbox` attribute.

## Future AI: "Paste the brand's email"

`src/lib/deal-extraction` defines a `DealTermsExtractor` interface that turns a brief into calculator answers
(platform, deliverable, count, usage type and term, exclusivity, deadline). Today it uses a free keyword-based
extractor; pointing `NEXT_PUBLIC_DEAL_EXTRACTION_ENDPOINT` at a small serverless function that asks an LLM for the
same JSON shape swaps it in. Models only extract terms; pricing always stays in the deterministic engine.
