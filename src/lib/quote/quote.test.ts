import { describe, expect, it } from "vitest";
import { calculateRate } from "@/lib/pricing/engine";
import type { DealInputs } from "@/lib/pricing/types";
import { buildBrandReply, buildQuote, formatQuoteText } from "./quote";

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

const sum = (amounts: number[]) => amounts.reduce((a, b) => a + b, 0);

describe("buildQuote", () => {
  it("itemizes deliverable, usage and exclusivity, summing to the ask", () => {
    const r = calculateRate(deal({ usage: "paid", usageDuration: "90d", exclusivity: "30d" }));
    const q = buildQuote(r);
    expect(q.total).toBe(r.ask);
    expect(q.lines.map((l) => l.id)).toEqual(["content", "usage", "exclusivity"]);
    expect(sum(q.lines.map((l) => l.amount))).toBe(q.total);
    expect(q.lines[1].label).toBe("90-day paid usage rights");
    expect(q.lines[2].label).toBe("30-day category exclusivity");
    for (const line of q.lines) expect(line.amount).toBeGreaterThan(0);
  });

  it("supports target and custom totals", () => {
    const r = calculateRate(deal({ usage: "organic", usageDuration: "30d", timeline: "rush" }));
    expect(buildQuote(r, "target").total).toBe(r.target);
    const custom = buildQuote(r, "custom", 437);
    expect(custom.total).toBe(437);
    expect(sum(custom.lines.map((l) => l.amount))).toBe(437);
  });

  it("always sums exactly, across many deals and totals", () => {
    const usages = ["none", "organic", "paid", "whitelisting", "buyout"] as const;
    for (const usage of usages) {
      for (const followers of [100, 10_000, 2_000_000]) {
        const r = calculateRate(deal({ usage, followers, exclusivity: "7d", timeline: "1w", deliverables: 2 }));
        for (const total of [null, 51, 333, 1_001, 99_999]) {
          const q = buildQuote(r, total ? "custom" : "ask", total);
          expect(sum(q.lines.map((l) => l.amount))).toBe(q.total);
          for (const line of q.lines) expect(line.amount).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("names multiple and custom deliverables", () => {
    const multi = buildQuote(calculateRate(deal({ deliverables: 3, production: "high" })));
    expect(multi.lines[0].label).toBe("3 × Sponsored Instagram Reel (high production)");
    const custom = buildQuote(calculateRate(deal({ platform: "other", contentType: "custom", customLabel: "Newsletter feature" })));
    expect(custom.lines[0].label).toBe("Newsletter feature");
  });

  it("formats as copyable plain text", () => {
    const r = calculateRate(deal({ usage: "paid", usageDuration: "90d", exclusivity: "30d" }));
    const text = formatQuoteText(buildQuote(r));
    const lines = text.split("\n");
    expect(lines[0]).toMatch(/^Sponsored Instagram Reel — \$[\d,]+$/);
    expect(lines.at(-1)).toBe(`Total — $${r.ask.toLocaleString("en-US")}`);
  });
});

describe("buildBrandReply", () => {
  it("summarizes the deal in plain language", () => {
    const r = calculateRate(deal({ usage: "paid", usageDuration: "90d", exclusivity: "30d" }));
    const reply = buildBrandReply(r, buildQuote(r), { brandName: "Acme" });
    expect(reply).toContain("Hi Acme team,");
    expect(reply).toContain(`would be $${r.ask.toLocaleString("en-US")}`);
    expect(reply).toContain("one sponsored Reel, 90 days of paid usage, and 30 days of category exclusivity");
  });

  it("offers usage rights separately when none were requested", () => {
    const r = calculateRate(deal());
    const reply = buildBrandReply(r, buildQuote(r));
    expect(reply).toContain("Hi there,");
    expect(reply).toContain("Based on the deliverables outlined");
    expect(reply).toContain("quote usage rights separately");
  });

  it("mentions rush delivery and perpetual terms", () => {
    const r = calculateRate(deal({ usage: "buyout", usageDuration: "perpetual", timeline: "3d", deliverables: 2 }));
    const reply = buildBrandReply(r, buildQuote(r), { creatorName: "Sam" });
    expect(reply).toContain("two sponsored Reels");
    expect(reply).toContain("perpetual full buyout usage");
    expect(reply).toContain("delivery within 3 days");
    expect(reply.trim().endsWith("Sam")).toBe(true);
  });
});
