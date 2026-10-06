import { describe, expect, it } from "vitest";
import { extractDealTermsSync } from "./heuristic";

describe("heuristic deal extraction", () => {
  it("handles the canonical example brief", () => {
    const { preset } = extractDealTermsSync(
      "We'd love to have you create one TikTok and give us 6 months of paid usage and 90 days of exclusivity.",
    );
    expect(preset).toMatchObject({
      platform: "tiktok",
      contentType: "sponsored",
      deliverables: 1,
      usage: "paid",
      usageDuration: "6m",
      exclusivity: "90d",
    });
  });

  it("detects whitelisting, multiple Reels, and a rush timeline", () => {
    const { preset, unpriced } = extractDealTermsSync(
      "Hi! We're looking for 2 Instagram Reels plus partnership ads for 30 days. We need them ASAP, and raw footage too.",
    );
    expect(preset).toMatchObject({
      platform: "instagram",
      contentType: "reel",
      deliverables: 2,
      usage: "whitelisting",
      usageDuration: "30d",
      timeline: "rush",
    });
    expect(unpriced).toContain("Raw footage");
  });

  it("detects YouTube integrations and perpetual buyouts", () => {
    const { preset } = extractDealTermsSync(
      "Would you do a 60-second integration in your next YouTube video? We'd need a full buyout in perpetuity.",
    );
    expect(preset).toMatchObject({ platform: "youtube", contentType: "integration", usage: "buyout", usageDuration: "perpetual" });
  });

  it("treats UGC briefs as UGC", () => {
    const { preset } = extractDealTermsSync("We need three UGC videos for our paid social, 90 day license.");
    expect(preset).toMatchObject({ contentType: "ugc", deliverables: 3, usage: "paid", usageDuration: "90d" });
  });

  it("returns nothing for unrelated text", () => {
    expect(extractDealTermsSync("Hope you're having a great week!").preset).toEqual({});
  });
});
