/**
 * PRICING ASSUMPTIONS — the single source of truth for every number the
 * calculator uses.
 *
 * These are planning assumptions for a negotiation starting point, not
 * objective market prices. Creator pricing varies enormously; change any value
 * here and the engine, results page, quote generator and methodology page all
 * update automatically. No application logic lives in this file.
 *
 * Conventions
 * - Money is in USD.
 * - `cpm` is a planning price per 1,000 expected views/impressions.
 * - Percentages that become fees are fractions (0.25 = +25% of the content fee).
 * - Multipliers are factors (1.1 = +10%, 0.85 = −15%).
 */

export const PRICING_CONFIG = {
  version: "2026.10",
  currency: "USD",
  locale: "en-US",

  /** No recommendation (midpoint) goes below this, however small the account. */
  minimumRate: 50,

  /**
   * Account-size tiers, by followers/subscribers. `upTo` is exclusive.
   * - reachFactor scales the default "views as a share of followers" estimate
   *   (smaller accounts usually reach a larger share of their audience).
   * - engagementBenchmarkFactor scales what "typical" engagement means for
   *   follower-based engagement rates (smaller accounts naturally engage more).
   */
  sizeTiers: [
    { id: "nano", label: "Under 10K", upTo: 10_000, reachFactor: 1.2, engagementBenchmarkFactor: 1.5 },
    { id: "micro", label: "10K–100K", upTo: 100_000, reachFactor: 1, engagementBenchmarkFactor: 1 },
    { id: "mid", label: "100K–500K", upTo: 500_000, reachFactor: 0.85, engagementBenchmarkFactor: 0.7 },
    { id: "macro", label: "500K–1M", upTo: 1_000_000, reachFactor: 0.75, engagementBenchmarkFactor: 0.55 },
    { id: "mega", label: "1M+", upTo: Number.POSITIVE_INFINITY, reachFactor: 0.6, engagementBenchmarkFactor: 0.45 },
  ],

  /**
   * Platforms and the deliverables offered for each.
   *
   * Per deliverable:
   * - cpm:         planning $ per 1,000 expected views
   * - creationFee: the value of making the content itself, independent of
   *                audience (this keeps small creators from being priced at ~$0)
   * - reachRate:   default expected views as a share of followers, used only
   *                when the creator doesn't enter their typical views
   * - ugc:         priced on the content + rights only (not posted by the creator)
   * - custom:      the creator names the deliverable themselves
 * - viewsNoun:   what one "view" is called for this format (default "views")
   *
   * engagement.basis says how the platform's engagement rate is usually
   * measured; engagement.benchmark is a "typical" rate (%) on that basis for a
   * 10K–100K account.
   */
  platforms: {
    instagram: {
      label: "Instagram",
      audienceNoun: "followers",
      engagement: { basis: "followers", benchmark: 2, interactions: "likes + comments + saves + shares" },
      contentTypes: [
        {
          id: "reel",
          label: "Reel",
          description: "Short-form vertical video",
          name: "Sponsored Instagram Reel",
          noun: { one: "sponsored Reel", many: "sponsored Reels" },
          viewsLabel: "Typical views per Reel",
          cpm: 28,
          creationFee: 175,
          reachRate: 0.3,
        },
        {
          id: "feed-post",
          label: "Feed post",
          description: "A single photo or graphic",
          name: "Sponsored Instagram feed post",
          noun: { one: "sponsored feed post", many: "sponsored feed posts" },
          viewsLabel: "Typical reach per feed post",
          viewsNoun: "accounts reached",
          cpm: 22,
          creationFee: 125,
          reachRate: 0.15,
        },
        {
          id: "carousel",
          label: "Carousel",
          description: "A multi-image or multi-slide post",
          name: "Sponsored Instagram carousel",
          noun: { one: "sponsored carousel", many: "sponsored carousels" },
          viewsLabel: "Typical reach per carousel",
          viewsNoun: "accounts reached",
          cpm: 24,
          creationFee: 150,
          reachRate: 0.18,
        },
        {
          id: "story",
          label: "Story",
          description: "A set of up to 3 Story frames",
          name: "Sponsored Instagram Story set (up to 3 frames)",
          noun: { one: "Story set", many: "Story sets" },
          viewsLabel: "Typical views per Story",
          cpm: 14,
          creationFee: 60,
          reachRate: 0.06,
        },
        {
          id: "custom",
          label: "Something else",
          description: "Describe your own deliverable",
          name: "Custom Instagram deliverable",
          noun: { one: "custom deliverable", many: "custom deliverables" },
          viewsLabel: "Typical views per piece",
          cpm: 22,
          creationFee: 125,
          reachRate: 0.15,
          custom: true,
        },
      ],
    },
    tiktok: {
      label: "TikTok",
      audienceNoun: "followers",
      engagement: { basis: "views", benchmark: 5, interactions: "likes + comments + shares + saves" },
      contentTypes: [
        {
          id: "sponsored",
          label: "Sponsored TikTok",
          description: "A video posted on your account",
          name: "Sponsored TikTok video",
          noun: { one: "sponsored TikTok", many: "sponsored TikToks" },
          viewsLabel: "Typical views per video",
          cpm: 25,
          creationFee: 175,
          reachRate: 0.25,
        },
        {
          id: "ugc",
          label: "UGC video",
          description: "For the brand's own channels or ads — not posted by you",
          name: "UGC video (for brand use)",
          noun: { one: "UGC video", many: "UGC videos" },
          viewsLabel: "Typical views per video",
          cpm: 0,
          creationFee: 200,
          reachRate: 0,
          ugc: true,
        },
        {
          id: "plus-story",
          label: "TikTok + Story",
          description: "A sponsored TikTok plus a Story",
          name: "Sponsored TikTok + Story",
          noun: { one: "sponsored TikTok plus a Story", many: "sponsored TikToks plus Stories" },
          viewsLabel: "Typical views per video",
          cpm: 30,
          creationFee: 200,
          reachRate: 0.25,
        },
        {
          id: "custom",
          label: "Something else",
          description: "Describe your own deliverable",
          name: "Custom TikTok deliverable",
          noun: { one: "custom deliverable", many: "custom deliverables" },
          viewsLabel: "Typical views per piece",
          cpm: 22,
          creationFee: 150,
          reachRate: 0.2,
          custom: true,
        },
      ],
    },
    youtube: {
      label: "YouTube",
      audienceNoun: "subscribers",
      engagement: { basis: "views", benchmark: 4, interactions: "likes + comments" },
      contentTypes: [
        {
          id: "short",
          label: "Short",
          description: "A vertical video under 60 seconds",
          name: "Sponsored YouTube Short",
          noun: { one: "sponsored Short", many: "sponsored Shorts" },
          viewsLabel: "Typical views per Short",
          cpm: 20,
          creationFee: 175,
          reachRate: 0.15,
        },
        {
          id: "integration",
          label: "Integration",
          description: "A 30–90 second sponsored segment in a video",
          name: "YouTube integration (30–90 sec)",
          noun: { one: "integrated sponsorship", many: "integrated sponsorships" },
          viewsLabel: "Typical views per video (first 30 days)",
          cpm: 30,
          creationFee: 250,
          reachRate: 0.15,
        },
        {
          id: "dedicated",
          label: "Dedicated video",
          description: "A full video about the brand or product",
          name: "Dedicated YouTube video",
          noun: { one: "dedicated video", many: "dedicated videos" },
          viewsLabel: "Typical views per video (first 30 days)",
          cpm: 60,
          creationFee: 600,
          reachRate: 0.15,
        },
        {
          id: "custom",
          label: "Something else",
          description: "Describe your own deliverable",
          name: "Custom YouTube deliverable",
          noun: { one: "custom deliverable", many: "custom deliverables" },
          viewsLabel: "Typical views per piece",
          cpm: 30,
          creationFee: 250,
          reachRate: 0.15,
          custom: true,
        },
      ],
    },
    x: {
      label: "X",
      audienceNoun: "followers",
      engagement: { basis: "followers", benchmark: 0.5, interactions: "likes + replies + reposts + bookmarks" },
      contentTypes: [
        {
          id: "post",
          label: "Sponsored post",
          description: "A single post",
          name: "Sponsored post on X",
          noun: { one: "sponsored post", many: "sponsored posts" },
          viewsLabel: "Typical impressions per post",
          viewsNoun: "impressions",
          cpm: 10,
          creationFee: 60,
          reachRate: 0.1,
        },
        {
          id: "thread",
          label: "Sponsored thread",
          description: "A multi-post thread",
          name: "Sponsored thread on X",
          noun: { one: "sponsored thread", many: "sponsored threads" },
          viewsLabel: "Typical impressions per thread",
          viewsNoun: "impressions",
          cpm: 14,
          creationFee: 120,
          reachRate: 0.1,
        },
        {
          id: "custom",
          label: "Something else",
          description: "Describe your own deliverable",
          name: "Custom deliverable on X",
          noun: { one: "custom deliverable", many: "custom deliverables" },
          viewsLabel: "Typical impressions per piece",
          viewsNoun: "impressions",
          cpm: 10,
          creationFee: 75,
          reachRate: 0.1,
          custom: true,
        },
      ],
    },
    linkedin: {
      label: "LinkedIn",
      audienceNoun: "followers",
      engagement: { basis: "followers", benchmark: 2, interactions: "reactions + comments + reposts" },
      contentTypes: [
        {
          id: "post",
          label: "Sponsored post",
          description: "A text, image, or document post",
          name: "Sponsored LinkedIn post",
          noun: { one: "sponsored LinkedIn post", many: "sponsored LinkedIn posts" },
          viewsLabel: "Typical impressions per post",
          viewsNoun: "impressions",
          cpm: 35,
          creationFee: 150,
          reachRate: 0.12,
        },
        {
          id: "video",
          label: "Video post",
          description: "A native video post",
          name: "Sponsored LinkedIn video",
          noun: { one: "sponsored LinkedIn video", many: "sponsored LinkedIn videos" },
          viewsLabel: "Typical impressions per video",
          viewsNoun: "impressions",
          cpm: 40,
          creationFee: 250,
          reachRate: 0.12,
        },
        {
          id: "custom",
          label: "Something else",
          description: "Describe your own deliverable",
          name: "Custom LinkedIn deliverable",
          noun: { one: "custom deliverable", many: "custom deliverables" },
          viewsLabel: "Typical impressions per piece",
          viewsNoun: "impressions",
          cpm: 35,
          creationFee: 150,
          reachRate: 0.1,
          custom: true,
        },
      ],
    },
    twitch: {
      label: "Twitch",
      audienceNoun: "followers",
      engagement: { basis: "followers", benchmark: 2, interactions: "chatters + new follows + subs" },
      contentTypes: [
        {
          id: "segment",
          label: "Sponsored segment",
          description: "A mention, overlay, or segment during a stream",
          name: "Sponsored stream segment",
          noun: { one: "sponsored stream segment", many: "sponsored stream segments" },
          viewsLabel: "Typical total viewers per stream",
          viewsNoun: "viewers",
          cpm: 40,
          creationFee: 150,
          reachRate: 0.06,
        },
        {
          id: "dedicated-stream",
          label: "Dedicated stream",
          description: "A 1–2 hour stream built around the brand",
          name: "Dedicated sponsored stream",
          noun: { one: "dedicated sponsored stream", many: "dedicated sponsored streams" },
          viewsLabel: "Typical total viewers per stream",
          viewsNoun: "viewers",
          cpm: 80,
          creationFee: 400,
          reachRate: 0.06,
        },
        {
          id: "custom",
          label: "Something else",
          description: "Describe your own deliverable",
          name: "Custom Twitch deliverable",
          noun: { one: "custom deliverable", many: "custom deliverables" },
          viewsLabel: "Typical viewers per piece",
          viewsNoun: "viewers",
          cpm: 40,
          creationFee: 150,
          reachRate: 0.06,
          custom: true,
        },
      ],
    },
    other: {
      label: "Other",
      audienceNoun: "followers",
      engagement: { basis: "followers", benchmark: 2, interactions: "likes + comments + shares" },
      contentTypes: [
        {
          id: "custom",
          label: "Custom deliverable",
          description: "Newsletter, podcast, blog, Pinterest, Snapchat…",
          name: "Custom deliverable",
          noun: { one: "custom deliverable", many: "custom deliverables" },
          viewsLabel: "Typical views or opens per piece",
          cpm: 20,
          creationFee: 150,
          reachRate: 0.1,
          custom: true,
        },
        {
          id: "ugc",
          label: "UGC video",
          description: "For the brand's own channels or ads — not posted by you",
          name: "UGC video (for brand use)",
          noun: { one: "UGC video", many: "UGC videos" },
          viewsLabel: "Typical views per video",
          cpm: 0,
          creationFee: 200,
          reachRate: 0,
          ugc: true,
        },
      ],
    },
  },

  /**
   * Engagement compared with the platform benchmark (ratio = yours ÷ typical).
   * Tiers are deliberately coarse — engagement is a quality signal, not a
   * precise price driver. `belowRatio` is exclusive.
   */
  engagementTiers: [
    { belowRatio: 0.5, multiplier: 0.85, label: "Below typical" },
    { belowRatio: 0.8, multiplier: 0.93, label: "Slightly below typical" },
    { belowRatio: 1.25, multiplier: 1, label: "About typical" },
    { belowRatio: 2, multiplier: 1.1, label: "Above typical" },
    { belowRatio: 3, multiplier: 1.2, label: "Strong" },
    { belowRatio: Number.POSITIVE_INFINITY, multiplier: 1.3, label: "Exceptional" },
  ],

  /**
   * Niches are grouped into broad advertiser-demand bands instead of
   * pretending each niche has a precise multiplier.
   */
  nicheBands: {
    standard: { multiplier: 1, label: "Typical advertiser demand" },
    elevated: { multiplier: 1.1, label: "Somewhat higher advertiser demand" },
    premium: { multiplier: 1.25, label: "Higher advertiser demand" },
    high: { multiplier: 1.4, label: "High-value audience for advertisers" },
  },
  niches: {
    general: { label: "General / Lifestyle", band: "standard" },
    beauty: { label: "Beauty", band: "elevated" },
    fashion: { label: "Fashion", band: "elevated" },
    food: { label: "Food", band: "standard" },
    fitness: { label: "Fitness", band: "elevated" },
    travel: { label: "Travel", band: "elevated" },
    gaming: { label: "Gaming", band: "standard" },
    finance: { label: "Finance", band: "high" },
    business: { label: "Business / B2B", band: "high" },
    technology: { label: "Technology", band: "premium" },
    parenting: { label: "Parenting", band: "elevated" },
    education: { label: "Education", band: "elevated" },
    "real-estate": { label: "Real Estate", band: "premium" },
    automotive: { label: "Automotive", band: "premium" },
    other: { label: "Other", band: "standard" },
  },

  /** Where most of the audience is. Reflects differences in advertising prices. */
  locations: {
    "us-ca": { label: "Mostly US / Canada", multiplier: 1 },
    "uk-eu": { label: "Mostly UK / Western Europe", multiplier: 0.9 },
    "au-nz": { label: "Mostly Australia / New Zealand", multiplier: 0.95 },
    global: { label: "Global / mixed", multiplier: 0.8 },
    "lower-cost": { label: "Mostly lower advertising-cost markets", multiplier: 0.55 },
    other: { label: "Other / not sure", multiplier: 0.8 },
  },

  /** Production effort per deliverable. */
  production: {
    simple: {
      label: "Simple",
      multiplier: 0.85,
      examples: ["Talking to camera, one take", "Product shown in your normal routine", "Minimal editing"],
    },
    standard: {
      label: "Standard",
      multiplier: 1,
      examples: ["A short script or outline", "A few shots or angles", "Basic editing, captions, music"],
    },
    high: {
      label: "High production",
      multiplier: 1.35,
      examples: ["Multiple scenes or locations", "Props, styling, or b-roll", "Careful lighting and a detailed edit"],
    },
    "very-high": {
      label: "Very high production",
      multiplier: 1.75,
      examples: ["Concept development or storyboard", "Other people on camera or a crew", "Advanced editing, effects, or motion graphics"],
    },
  },

  /** Each deliverable after the first is priced at this share of the first. */
  deliverables: { additionalPieceFactor: 0.9, max: 20 },

  /**
   * Usage rights: a fee equal to a share of the content fee, by type and term.
   * More rights for longer = more money.
   */
  usageDurations: {
    "30d": { label: "30 days", adjective: "30-day" },
    "90d": { label: "90 days", adjective: "90-day" },
    "6m": { label: "6 months", adjective: "6-month" },
    "12m": { label: "12 months", adjective: "12-month" },
    perpetual: { label: "Perpetual", adjective: "Perpetual" },
  },
  usageTypes: {
    none: {
      label: "No — only posted on my account",
      shortLabel: "No usage rights",
      description: "The brand can share or link to your post, but not repost it or run it as an ad.",
      rights: "",
      fees: { "30d": 0, "90d": 0, "6m": 0, "12m": 0, perpetual: 0 },
    },
    organic: {
      label: "Organic reuse",
      shortLabel: "Organic reuse",
      description: "Reposted on the brand's website, social channels, or emails — no paid ads.",
      rights: "organic usage rights",
      fees: { "30d": 0.1, "90d": 0.2, "6m": 0.3, "12m": 0.45, perpetual: 0.75 },
    },
    paid: {
      label: "Paid advertising",
      shortLabel: "Paid ads",
      description: "The brand runs your content as ads from their own accounts.",
      rights: "paid usage rights",
      fees: { "30d": 0.25, "90d": 0.5, "6m": 0.75, "12m": 1, perpetual: 1.75 },
    },
    whitelisting: {
      label: "Whitelisting / partnership ads / Spark Ads",
      shortLabel: "Whitelisting",
      description: "The brand runs ads through your account, under your name.",
      rights: "whitelisting / partnership ad rights",
      fees: { "30d": 0.3, "90d": 0.6, "6m": 0.9, "12m": 1.25, perpetual: 2 },
    },
    buyout: {
      label: "Full buyout / broad commercial usage",
      shortLabel: "Full buyout",
      description: "Broad commercial use in any channel, including paid ads.",
      rights: "full buyout / broad commercial usage",
      fees: { "30d": 0.5, "90d": 0.8, "6m": 1.1, "12m": 1.5, perpetual: 2.5 },
    },
  },

  /** Exclusivity: a fee equal to a share of the content fee. */
  exclusivity: {
    none: { label: "None", fee: 0 },
    "7d": { label: "7 days", fee: 0.05, adjective: "7-day", phrase: "7 days" },
    "30d": { label: "30 days", fee: 0.15, adjective: "30-day", phrase: "30 days" },
    "90d": { label: "90 days", fee: 0.3, adjective: "90-day", phrase: "90 days" },
    "6m": { label: "6 months", fee: 0.5, adjective: "6-month", phrase: "6 months" },
  },

  /** Turnaround: a fee equal to a share of the content fee. */
  timelines: {
    normal: { label: "Normal timeline", description: "2+ weeks", fee: 0, phrase: "" },
    "1w": { label: "Within 1 week", description: "A tighter turnaround", fee: 0.1, phrase: "delivery within 1 week" },
    "3d": { label: "Within 3 days", description: "Rearranging your schedule", fee: 0.25, phrase: "delivery within 3 days" },
    rush: { label: "Rush / ASAP", description: "48 hours or less", fee: 0.5, phrase: "rush delivery (48 hours or less)" },
  },

  /** How wide the low–high range is (± share of the midpoint). */
  range: {
    baseSpread: 0.15,
    estimatedViewsSpread: 0.08,
    missingEngagementSpread: 0.04,
    unusualInputSpread: 0.05,
    maxSpread: 0.35,
  },

  /** Negotiation positions derived from the range. */
  strategy: {
    /** ask = midpoint + askPosition × (high − midpoint) */
    askPosition: 0.5,
    /** target = midpoint − targetPosition × (midpoint − low) */
    targetPosition: 0.35,
    /** walk-away floor = low × floorFactor */
    floorFactor: 0.9,
  },

  /** Range width → how confident the estimate is. */
  confidence: { goodMaxSpread: 0.17, fairMaxSpread: 0.25 },

  /** Current-rate comparison: "well below" when current < low × this. */
  comparison: { wellBelowFactor: 0.7 },

  /** Thresholds for "this estimate is less reliable" notes. */
  reliability: {
    smallAccountFollowers: 1_000,
    largeAccountFollowers: 1_000_000,
    viewsHighMultipleOfFollowers: 5,
    viewsLowShareOfFollowers: 0.01,
    engagementUnusualPercent: 20,
    engagementUnusualRatio: 4,
    engagementVeryLowRatio: 0.2,
  },

  /** Hard input limits. */
  limits: {
    maxFollowers: 1_000_000_000,
    maxViews: 5_000_000_000,
    maxEngagementPercent: 100,
    maxCurrentRate: 10_000_000,
    maxCustomLabelLength: 60,
  },

  /** Rounding steps so outputs look like real prices ($1,050, not $1,037.42). */
  rounding: [
    { below: 100, step: 5 },
    { below: 1_000, step: 25 },
    { below: 5_000, step: 50 },
    { below: 20_000, step: 100 },
    { below: 50_000, step: 500 },
    { below: 200_000, step: 1_000 },
    { below: Number.POSITIVE_INFINITY, step: 5_000 },
  ],
} as const;

export type PricingConfig = typeof PRICING_CONFIG;
