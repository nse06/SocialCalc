import { describe, expect, it } from "vitest";
import { EMPTY_DRAFT, dealToDraft, dealToSearchParams, draftToDeal, searchParamsToPreset, sharedLinkDraft } from "./draft";
import { parseHumanNumber } from "./format";
import type { DealInputs } from "./types";

const fullDeal: DealInputs = {
  platform: "tiktok",
  contentType: "sponsored",
  production: "high",
  followers: 50_000,
  views: 12_000,
  engagementRate: 5.5,
  niche: "finance",
  location: "uk-eu",
  usage: "paid",
  usageDuration: "6m",
  exclusivity: "30d",
  deliverables: 3,
  timeline: "3d",
  currentRate: 400,
};

describe("draft ↔ deal", () => {
  it("requires the essentials", () => {
    expect(draftToDeal(EMPTY_DRAFT)).toBeNull();
    expect(draftToDeal({ ...dealToDraft(fullDeal), followers: null })).toBeNull();
  });

  it("round-trips a complete deal", () => {
    expect(draftToDeal(dealToDraft(fullDeal))).toEqual(fullDeal);
  });

  it("UGC needs no followers or location", () => {
    const ugc = draftToDeal({
      ...EMPTY_DRAFT,
      platform: "tiktok",
      contentType: "ugc",
      production: "standard",
      niche: "beauty",
      usage: "paid",
    });
    expect(ugc).not.toBeNull();
    expect(ugc?.followers).toBeNull();
  });

  it("honors 'estimate my views' and 'skip engagement'", () => {
    const deal = draftToDeal({ ...dealToDraft(fullDeal), viewsUnknown: true, engagementSkipped: true });
    expect(deal?.views).toBeNull();
    expect(deal?.engagementRate).toBeNull();
  });
});

describe("shareable URLs", () => {
  it("round-trips through search params, without the current rate", () => {
    const params = dealToSearchParams(fullDeal);
    expect(params.toString()).not.toContain("400");
    const draft = { ...EMPTY_DRAFT, ...searchParamsToPreset(params) };
    expect(draftToDeal(draft)).toEqual({ ...fullDeal, currentRate: null });
  });

  it("treats a complete link without views or engagement as estimated", () => {
    const params = dealToSearchParams({ ...fullDeal, views: null, engagementRate: null });
    const draft = sharedLinkDraft(EMPTY_DRAFT, searchParamsToPreset(params));
    expect(draft).not.toBeNull();
    expect(draftToDeal(draft!)).toMatchObject({ views: null, engagementRate: null, followers: 50_000 });
  });

  it("leaves partial links incomplete so the calculator keeps asking", () => {
    const preset = searchParamsToPreset(new URLSearchParams("p=instagram&c=reel&f=10000"));
    expect(sharedLinkDraft(EMPTY_DRAFT, preset)).toBeNull();
    expect(preset.viewsUnknown).toBeUndefined();
    expect(preset.engagementSkipped).toBeUndefined();
  });

  it("ignores invalid values", () => {
    const preset = searchParamsToPreset(new URLSearchParams("p=myspace&c=reel&f=-4&e=abc&u=forever&d=9999"));
    expect(preset.platform).toBeUndefined();
    expect(preset.contentType).toBeUndefined();
    expect(preset.followers).toBeUndefined();
    expect(preset.usage).toBeUndefined();
    expect(preset.deliverables).toBe(20);
  });
});

describe("parseHumanNumber", () => {
  it.each([
    ["10000", 10_000],
    ["10,000", 10_000],
    ["10k", 10_000],
    ["1.2M", 1_200_000],
    [" $1,200 ", 1_200],
    ["3%", 3],
    ["0.5", 0.5],
  ])("parses %s", (input, expected) => {
    expect(parseHumanNumber(input)).toBe(expected);
  });

  it("supports decimal commas when asked", () => {
    expect(parseHumanNumber("3,5", { decimalComma: true })).toBe(3.5);
    expect(parseHumanNumber("3,500", { decimalComma: true })).toBe(3_500);
  });

  it.each(["", "abc", "1.2.3", "-5", "ten"])("rejects %j", (input) => {
    expect(parseHumanNumber(input)).toBeNaN();
  });
});
