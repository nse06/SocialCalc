import { describe, expect, it } from "vitest";
import { PRICING_CONFIG } from "./config";
import { PLATFORM_IDS, getContentTypes } from "./catalog";
import { calculateRate, estimateViews, priceLadder, sanitizeDeal } from "./engine";
import { roundPrice } from "./rounding";
import type { DealInputs } from "./types";

const deal = (overrides: Partial<DealInputs> = {}): DealInputs => ({
  platform: "instagram",
  contentType: "reel",
  production: "standard",
  followers: 10_000,
  views: null,
  engagementRate: 3,
  niche: "general",
  location: "us-ca",
  usage: "none",
  usageDuration: "90d",
  exclusivity: "none",
  deliverables: 1,
  timeline: "normal",
  ...overrides,
});

function expectSaneLadder(r: ReturnType<typeof calculateRate>) {
  expect(r.floor).toBeGreaterThan(0);
  expect(r.floor).toBeLessThan(r.low);
  expect(r.low).toBeLessThanOrEqual(r.target);
  expect(r.target).toBeLessThanOrEqual(r.ask);
  expect(r.ask).toBeLessThanOrEqual(r.high);
  expect(r.low).toBeLessThan(r.high);
  for (const value of [r.low, r.high, r.ask, r.target, r.floor, r.fairValue]) {
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBe(roundPrice(value));
  }
}

describe("acceptance scenarios", () => {
  it("A: 10K Instagram, 3% engagement, Reel, standard, no usage", () => {
    const r = calculateRate(deal());
    expectSaneLadder(r);
    expect(r.reach.estimated).toBe(true);
    expect(r.engagement.multiplier).toBeGreaterThan(1); // 3% beats the ~2% benchmark
    expect(r.ask).toBeGreaterThanOrEqual(200);
    expect(r.ask).toBeLessThanOrEqual(600);
    expect(r.components.usage).toBe(0);
    expect(r.components.exclusivity).toBe(0);
  });

  it("B: 50K TikTok, 5%, sponsored, 90 days paid usage, 30 days exclusivity", () => {
    const plain = calculateRate(deal({ platform: "tiktok", contentType: "sponsored", followers: 50_000, engagementRate: 5 }));
    const r = calculateRate(
      deal({
        platform: "tiktok",
        contentType: "sponsored",
        followers: 50_000,
        engagementRate: 5,
        usage: "paid",
        usageDuration: "90d",
        exclusivity: "30d",
      }),
    );
    expectSaneLadder(r);
    expect(r.components.usage).toBeCloseTo(r.components.content * 0.5);
    expect(r.components.exclusivity).toBeCloseTo(r.components.content * 0.15);
    expect(r.ask).toBeGreaterThan(plain.ask * 1.4);
    expect(r.ask).toBeGreaterThanOrEqual(600);
    expect(r.ask).toBeLessThanOrEqual(2_000);
  });

  it("C: 100K YouTube, dedicated, high production, 6 months usage", () => {
    const standard = calculateRate(deal({ platform: "youtube", contentType: "dedicated", followers: 100_000, engagementRate: null }));
    const r = calculateRate(
      deal({
        platform: "youtube",
        contentType: "dedicated",
        followers: 100_000,
        engagementRate: null,
        production: "high",
        usage: "organic",
        usageDuration: "6m",
      }),
    );
    expectSaneLadder(r);
    expect(r.components.perPiece).toBeCloseTo(standard.components.perPiece * 1.35);
    expect(r.ask).toBeGreaterThanOrEqual(1_500);
    expect(r.ask).toBeLessThanOrEqual(6_000);
    expect(r.notes.map((n) => n.id)).toEqual(expect.arrayContaining(["views-estimated", "engagement-missing"]));
  });

  it("D: a small creator with excellent engagement can out-earn a bigger, less engaged one", () => {
    const small = calculateRate(deal({ followers: 4_000, views: 3_500, engagementRate: 8 }));
    const bigger = calculateRate(deal({ followers: 25_000, views: 2_000, engagementRate: 0.8 }));
    expectSaneLadder(small);
    expectSaneLadder(bigger);
    expect(small.engagement.multiplier).toBeGreaterThan(1);
    expect(bigger.engagement.multiplier).toBeLessThan(1);
    expect(small.ask).toBeGreaterThan(bigger.ask);
  });

  it("E: flags a current rate well below the range", () => {
    const r = calculateRate(deal({ currentRate: 100 }));
    expect(r.comparison?.status).toBe("well-below");
    expect(r.comparison?.askMultiple).toBeGreaterThan(2);

    expect(calculateRate(deal({ currentRate: r.low - 5 })).comparison?.status).toBe("below");
    expect(calculateRate(deal({ currentRate: r.fairValue })).comparison?.status).toBe("within");
    expect(calculateRate(deal({ currentRate: r.high * 2 })).comparison?.status).toBe("above");
    expect(calculateRate(deal()).comparison).toBeNull();
  });

  it("F: none → 12 months paid usage is a meaningful increase", () => {
    const none = calculateRate(deal());
    const paid = calculateRate(deal({ usage: "paid", usageDuration: "12m" }));
    expect(paid.ask).toBeGreaterThanOrEqual(none.ask * 1.75);
    expect(paid.lines.find((l) => l.id === "usage")?.active).toBe(true);
  });
});

describe("more rights = more money", () => {
  it("usage fees increase with broader rights and longer terms", () => {
    const types = ["none", "organic", "paid", "whitelisting", "buyout"] as const;
    const durations = ["30d", "90d", "6m", "12m", "perpetual"] as const;
    for (const duration of durations) {
      const totals = types.map((usage) => calculateRate(deal({ usage, usageDuration: duration })).components.total);
      for (let i = 1; i < totals.length; i++) expect(totals[i]).toBeGreaterThan(totals[i - 1]);
    }
    for (const usage of types.slice(1)) {
      const totals = durations.map((usageDuration) => calculateRate(deal({ usage, usageDuration })).components.total);
      for (let i = 1; i < totals.length; i++) expect(totals[i]).toBeGreaterThan(totals[i - 1]);
    }
  });

  it("exclusivity, rush and production all increase price", () => {
    const base = calculateRate(deal()).components.total;
    expect(calculateRate(deal({ exclusivity: "6m" })).components.total).toBeGreaterThan(base);
    expect(calculateRate(deal({ timeline: "rush" })).components.total).toBeGreaterThan(base);
    expect(calculateRate(deal({ production: "very-high" })).components.total).toBeGreaterThan(base);
    expect(calculateRate(deal({ production: "simple" })).components.total).toBeLessThan(base);
  });

  it("additional deliverables are discounted but add up", () => {
    const one = calculateRate(deal());
    const three = calculateRate(deal({ deliverables: 3 }));
    expect(three.components.content).toBeCloseTo(one.components.content * (1 + 2 * 0.9));
  });
});

describe("calibration guardrails", () => {
  // Heavier formats should never price below lighter ones on the same platform.
  const ORDERINGS: [DealInputs["platform"], string[]][] = [
    ["instagram", ["story", "feed-post", "carousel", "reel"]],
    ["tiktok", ["sponsored", "plus-story"]],
    ["youtube", ["short", "integration", "dedicated"]],
    ["x", ["post", "thread"]],
    ["linkedin", ["post", "video"]],
    ["twitch", ["segment", "dedicated-stream"]],
  ];

  it.each(ORDERINGS)("%s formats are ordered by weight at every size", (platform, formats) => {
    for (const followers of [500, 5_000, 50_000, 500_000, 5_000_000]) {
      const totals = formats.map(
        (contentType) => calculateRate(deal({ platform, contentType, followers, engagementRate: null })).components.total,
      );
      for (let i = 1; i < totals.length; i++) expect(totals[i]).toBeGreaterThanOrEqual(totals[i - 1]);
    }
  });

  it("bigger audiences with the same performance profile cost more", () => {
    const asks = [1_000, 10_000, 100_000, 1_000_000].map((followers) => calculateRate(deal({ followers })).components.total);
    for (let i = 1; i < asks.length; i++) expect(asks[i]).toBeGreaterThan(asks[i - 1]);
  });
});

describe("reach", () => {
  it("prefers real views over follower-based estimates", () => {
    const withViews = calculateRate(deal({ views: 20_000 }));
    expect(withViews.reach).toMatchObject({ views: 20_000, estimated: false });
    expect(withViews.components.audience).toBeCloseTo(20 * 28);
  });

  it("follower count alone doesn't guarantee a higher price", () => {
    const manyFollowersFewViews = calculateRate(deal({ followers: 200_000, views: 2_000 }));
    const fewFollowersManyViews = calculateRate(deal({ followers: 20_000, views: 40_000 }));
    expect(fewFollowersManyViews.ask).toBeGreaterThan(manyFollowersFewViews.ask);
  });

  it("estimates scale down for bigger accounts", () => {
    const small = estimateViews("instagram", "reel", 5_000) / 5_000;
    const huge = estimateViews("instagram", "reel", 5_000_000) / 5_000_000;
    expect(small).toBeGreaterThan(huge);
  });

  it("treats zero views as unknown", () => {
    const r = calculateRate(deal({ views: 0 }));
    expect(r.reach.estimated).toBe(true);
    expect(r.reach.views).toBeGreaterThan(0);
  });

  it("UGC ignores audience and engagement", () => {
    const a = calculateRate(deal({ platform: "tiktok", contentType: "ugc", followers: 1_000_000, engagementRate: 30 }));
    const b = calculateRate(deal({ platform: "tiktok", contentType: "ugc", followers: 50, engagementRate: 1 }));
    expect(a.isUgc).toBe(true);
    expect(a.components.total).toBe(b.components.total);
    expect(a.lines.some((l) => l.id === "audience")).toBe(false);
  });
});

describe("robustness", () => {
  it("never produces absurd output for every platform and format", () => {
    for (const platform of PLATFORM_IDS) {
      for (const content of getContentTypes(platform)) {
        for (const followers of [1, 500, 10_000, 1_000_000, 900_000_000]) {
          const r = calculateRate(deal({ platform, contentType: content.id, followers }));
          expectSaneLadder(r);
          expect(Number.isFinite(r.components.total)).toBe(true);
          expect(r.fairValue).toBeGreaterThanOrEqual(PRICING_CONFIG.minimumRate - 5);
        }
      }
    }
  });

  it("sanitizes garbage input instead of crashing", () => {
    const garbage = {
      ...deal(),
      platform: "myspace",
      contentType: "hologram",
      followers: Number.NaN,
      views: -50,
      engagementRate: 900,
      deliverables: 999,
      niche: "astrology",
      usage: "forever",
    } as unknown as DealInputs;
    const clean = sanitizeDeal(garbage);
    expect(clean.platform).toBe("instagram");
    expect(clean.contentType).toBe("reel");
    expect(clean.followers).toBeNull();
    expect(clean.views).toBeNull();
    expect(clean.engagementRate).toBe(100);
    expect(clean.deliverables).toBe(PRICING_CONFIG.deliverables.max);
    expect(clean.niche).toBe("general");
    expect(clean.usage).toBe("none");
    expectSaneLadder(calculateRate(garbage));
  });

  it("caps the effect of extreme engagement and flags it", () => {
    const normal = calculateRate(deal({ engagementRate: 7 }));
    const extreme = calculateRate(deal({ engagementRate: 60 }));
    expect(extreme.engagement.multiplier).toBe(normal.engagement.multiplier);
    expect(extreme.notes.some((n) => n.id === "engagement-high")).toBe(true);
    expect(extreme.spread).toBeGreaterThan(normal.spread);
  });

  it("flags very small and very large accounts", () => {
    expect(calculateRate(deal({ followers: 300 })).notes.some((n) => n.id === "small-account")).toBe(true);
    const mega = calculateRate(deal({ followers: 20_000_000 }));
    expect(mega.notes.some((n) => n.id === "large-account")).toBe(true);
    expect(mega.confidence).toBe("rough");
  });

  it("flags views that look like a viral outlier", () => {
    const r = calculateRate(deal({ followers: 2_000, views: 500_000 }));
    expect(r.notes.some((n) => n.id === "views-high")).toBe(true);
  });

  it("gives tighter ranges with better data", () => {
    const rough = calculateRate(deal({ engagementRate: null }));
    const good = calculateRate(deal({ views: 3_000 }));
    expect(good.spread).toBeLessThan(rough.spread);
    expect(good.confidence).toBe("good");
  });
});

describe("price ladder", () => {
  it("keeps positions ordered even at tiny amounts", () => {
    for (const mid of [50, 55, 60, 75, 99, 100, 101, 240, 999, 1_000, 4_999, 5_000, 20_000, 123_456]) {
      for (const spread of [0.15, 0.23, 0.35]) {
        const l = priceLadder(mid, spread);
        expect(l.floor).toBeLessThan(l.low);
        expect(l.low).toBeLessThanOrEqual(l.target);
        expect(l.target).toBeLessThanOrEqual(l.ask);
        expect(l.ask).toBeLessThanOrEqual(l.high);
      }
    }
  });

  it("rounds to human prices", () => {
    expect(roundPrice(1037.42)).toBe(1050);
    expect(roundPrice(287)).toBe(275);
    expect(roundPrice(62)).toBe(60);
    expect(roundPrice(12_340)).toBe(12_300);
  });
});
