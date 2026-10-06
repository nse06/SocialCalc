import { type Page, expect, test } from "@playwright/test";
import { LOOKUP_PROFILE, mockProfileLookup } from "./profile-lookup";

const money = (text: string) => Number(text.replace(/[^\d]/g, ""));

/** Reads the recommended ask once the count-up animation has settled. */
async function settledAsk(page: Page): Promise<number> {
  const ask = page.getByTestId("recommended-ask");
  let previous = "";
  for (let i = 0; i < 20; i++) {
    const current = await ask.innerText();
    if (current === previous && money(current) > 0) return money(current);
    previous = current;
    await page.waitForTimeout(150);
  }
  return money(previous);
}

/** Scenario A answers: 10K Instagram followers, 3% engagement, Reel, standard effort, no usage. */
async function completeInstagramReel(page: Page, currentRate?: string) {
  await page.goto("/calculator");
  await page.getByRole("radio", { name: "Instagram" }).click();
  await page.getByRole("radio", { name: /^Reel/ }).click();
  await page.getByRole("radio", { name: /^Standard/ }).click();
  await page.getByRole("textbox", { name: "Followers" }).fill("10k");
  await page.getByRole("checkbox", { name: /not sure/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("textbox", { name: "Engagement rate" }).fill("3");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("radio", { name: "General / Lifestyle" }).click();
  await page.getByRole("radio", { name: "Mostly US / Canada" }).click();
  await page.getByRole("radio", { name: /^No — only posted/ }).click();
  if (currentRate) await page.getByRole("textbox", { name: /What do you usually charge/ }).fill(currentRate);
  await page.getByRole("button", { name: "See my rate" }).click();
  await expect(page.getByRole("heading", { name: "Your estimated rate" })).toBeVisible();
}

test.describe("calculator", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("G: completes the flow and copies the quote and brand reply", async ({ page }) => {
    await completeInstagramReel(page);
    const ask = await settledAsk(page);
    expect(ask).toBeGreaterThan(0);
    expect(page.url()).toContain("p=instagram");

    await page.getByRole("button", { name: "Generate my quote" }).first().click();
    const preview = page.getByTestId("quote-preview");
    await expect(preview).toContainText("Sponsored Instagram Reel");

    await page.getByRole("button", { name: "Copy quote" }).click();
    await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();
    const quote = await page.evaluate(() => navigator.clipboard.readText());
    expect(quote).toContain("Sponsored Instagram Reel — $");
    expect(quote).toContain(`Total — $${ask.toLocaleString("en-US")}`);

    await page.getByRole("button", { name: "Copy brand reply" }).click();
    const reply = await page.evaluate(() => navigator.clipboard.readText());
    expect(reply).toContain("Thanks for reaching out!");
    expect(reply).toContain("one sponsored Reel");

    const events = await page.evaluate(() => window.__analyticsEvents?.map((e) => e.event) ?? []);
    expect(events).toEqual(
      expect.arrayContaining(["calculator_started", "calculator_completed", "result_viewed", "quote_generated", "quote_copied"]),
    );
  });

  test("F: adding 12 months of paid usage meaningfully raises the price", async ({ page }) => {
    await completeInstagramReel(page);
    const before = await settledAsk(page);
    const adjust = page.locator("#adjust");
    await adjust.getByRole("radio", { name: /Paid ads/ }).click();
    await adjust.getByRole("radiogroup", { name: "Usage period" }).getByRole("radio", { name: "12 months" }).click();
    await expect.poll(() => settledAsk(page)).toBeGreaterThan(before * 1.7);
    await expect(page.getByText(/vs\. your original deal/)).toBeVisible();
    expect(page.url()).toContain("u=paid");
    expect(page.url()).toContain("ud=12m");
  });

  test("E: flags a current rate that is well below the range", async ({ page }) => {
    await completeInstagramReel(page);
    await page.getByRole("textbox", { name: "Your current rate for this" }).fill("100");
    await page.getByRole("button", { name: "Compare" }).click();
    await expect(page.getByRole("heading", { name: "You may be undercharging." })).toBeVisible();
    await expect(page.getByText("You currently charge $100.")).toBeVisible();
  });

  test("E: a current rate entered in the flow is compared right under the result", async ({ page }) => {
    await completeInstagramReel(page, "100");
    const verdict = page.getByRole("heading", { name: "You may be undercharging." });
    await expect(verdict).toBeVisible();
    // Shown before the breakdown, not buried below it.
    const verdictTop = (await verdict.boundingBox())?.y ?? 0;
    const breakdownTop = (await page.locator("#breakdown").boundingBox())?.y ?? 0;
    expect(verdictTop).toBeLessThan(breakdownTop);
  });

  test("UGC skips the audience questions", async ({ page }) => {
    await page.goto("/calculator");
    await page.getByRole("radio", { name: "TikTok" }).click();
    await page.getByRole("radio", { name: /^UGC video/ }).click();
    await page.getByRole("radio", { name: /^Standard/ }).click();
    // Straight to niche — no followers, engagement, or audience location.
    await page.getByRole("radio", { name: "Beauty" }).click();
    await expect(page.getByRole("heading", { name: "How will the brand use your UGC?" })).toBeVisible();
    await expect(page.getByRole("radio", { name: /^No — only posted/ })).toHaveCount(0);
    await page.getByRole("radio", { name: /^Paid advertising/ }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "See my rate" }).click();
    await expect(page.getByText("UGC is priced on the work and the rights")).toBeVisible();
  });

  test("shared links open straight to results, and back returns to the questions", async ({ page }) => {
    await page.goto("/calculator?p=tiktok&c=sponsored&pr=standard&f=50000&e=5&n=general&l=us-ca&u=paid&ud=90d&x=30d");
    await expect(page.getByRole("heading", { name: "Your estimated rate" })).toBeVisible();
    expect(await settledAsk(page)).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Edit answers" }).first().click();
    await expect(page.getByRole("heading", { name: "Where will the content run?" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "TikTok" })).toHaveAttribute("aria-checked", "true");
  });

  test("browser back moves to the previous question", async ({ page }) => {
    await page.goto("/calculator");
    await page.getByRole("radio", { name: "YouTube" }).click();
    await expect(page.getByRole("heading", { name: "What are you creating?" })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Where will the content run?" })).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/calculator");
  });

  test("the engagement helper works out the rate from a post's numbers", async ({ page }) => {
    await page.goto("/calculator?p=instagram&c=reel&pr=standard&f=10000");
    // Views unknown → straight to engagement after confirming the estimate.
    await page.getByRole("checkbox", { name: /not sure/ }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByText("Not sure? We'll work it out.").click();
    await page.getByRole("textbox", { name: "Likes" }).fill("250");
    await page.getByRole("textbox", { name: "Comments" }).fill("30");
    await page.getByRole("textbox", { name: "Saves" }).fill("20");
    await page.getByRole("button", { name: "Use 3%" }).click();
    await expect(page.getByRole("textbox", { name: "Engagement rate" })).toHaveValue("3");
  });

  test("the engagement helper asks for what each platform counts", async ({ page }) => {
    await page.goto("/calculator?p=youtube&c=integration&pr=standard&f=100000&v=20000");
    await page.getByText("Not sure? We'll work it out.").click();
    await expect(page.getByRole("textbox", { name: "Likes" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Comments" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Saves" })).toHaveCount(0);
  });

  test("works with the keyboard alone", async ({ page }) => {
    await page.goto("/calculator");
    await page.getByRole("radio", { name: "Instagram" }).focus();
    await page.keyboard.press("ArrowRight");
    const tiktok = page.getByRole("radio", { name: "TikTok" });
    await expect(tiktok).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(tiktok).toHaveAttribute("aria-checked", "true");
    // Keyboard selection never auto-advances; Continue does.
    await expect(page.getByRole("heading", { name: "Where will the content run?" })).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).focus();
    await page.keyboard.press("Enter");
    // Focus moves to the new question so screen readers announce it.
    await expect(page.getByRole("heading", { name: "What are you creating?" })).toBeFocused();
  });

  test("validates audience input instead of crashing", async ({ page }) => {
    await page.goto("/calculator?p=instagram&c=reel&pr=standard");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Enter your follower count — a rough number is fine.")).toBeVisible();
    await page.getByRole("textbox", { name: "Followers" }).fill("abc");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: /How big is your Instagram audience/ })).toBeVisible();
  });
});

test.describe("profile lookup", () => {
  test("fills the audience answers from a YouTube handle", async ({ page }) => {
    const requests = await mockProfileLookup(page);
    await page.goto("/calculator?p=youtube&c=integration&pr=standard");
    await page.getByRole("textbox", { name: "Your YouTube handle or channel link" }).fill("youtube.com/@testkitchen");
    await page.getByRole("button", { name: "Look up" }).click();

    await expect(page.getByRole("status").filter({ hasText: "Filled in your subscribers (125K)" })).toContainText(
      "typical views (40K), and engagement (4.2%) from 5 recent long-form videos",
    );
    expect(requests[0].searchParams.get("platform")).toBe("youtube");
    await expect(page.getByRole("textbox", { name: "Subscribers" })).toHaveValue("125,000");
    await expect(page.getByRole("textbox", { name: /Typical views per video/ })).toHaveValue("40,000");
    await expect(page.getByRole("link", { name: "Data from YouTube" })).toHaveAttribute("href", LOOKUP_PROFILE.profileUrl);

    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("textbox", { name: "Engagement rate" })).toHaveValue("4.2");

    // Analytics stay anonymous: an outcome and buckets, never the handle.
    const events = await page.evaluate(() => window.__analyticsEvents?.filter((e) => e.event === "profile_lookup") ?? []);
    expect(events).toHaveLength(1);
    expect(events[0].props).toMatchObject({ outcome: "found", filled_views: true, audience: "100K-1M" });
    expect(JSON.stringify(events)).not.toContain("testkitchen");
  });

  test("uses Shorts numbers for a Shorts deal and says what's missing", async ({ page }) => {
    await mockProfileLookup(page, 200, { ...LOOKUP_PROFILE, followers: null, formats: { short: LOOKUP_PROFILE.formats.short } });
    await page.goto("/calculator?p=youtube&c=short&pr=standard");
    await page.getByRole("textbox", { name: "Your YouTube handle or channel link" }).fill("@testkitchen");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status").filter({ hasText: "Filled in" })).toContainText(
      "Filled in your typical views (100K) and engagement (4%) from 3 recent Shorts. Check them and change anything that looks off. This channel hides its subscriber count, so add it below.",
    );
    await expect(page.getByRole("textbox", { name: "Subscribers" })).toHaveValue("");
  });

  test("explains when a channel can't be found, and the form still works", async ({ page }) => {
    await mockProfileLookup(page, 404, { error: "not_found", message: "We couldn't find that YouTube channel." });
    await page.goto("/calculator?p=youtube&c=integration&pr=standard");
    await page.getByRole("textbox", { name: "Your YouTube handle or channel link" }).fill("@nobody");
    await page.getByRole("button", { name: "Look up" }).click();
    await expect(page.getByText("We couldn't find that channel. Check the spelling, or enter your numbers below.")).toBeVisible();
    await page.getByRole("textbox", { name: "Subscribers" }).fill("20k");
    await page.getByRole("checkbox", { name: /not sure/ }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "How engaged is your audience?" })).toBeVisible();
  });

  test("the filled card fits a 320px screen", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await mockProfileLookup(page, 200, {
      ...LOOKUP_PROFILE,
      displayName: "A Very Long Channel Name That Keeps Going",
      handle: "@thelongestchannelhandle_ever",
    });
    await page.goto("/calculator?p=youtube&c=integration&pr=standard");
    await page.getByRole("textbox", { name: "Your YouTube handle or channel link" }).fill("@thelongestchannelhandle_ever");
    await page.getByRole("button", { name: "Look up" }).click();
    await expect(page.getByRole("link", { name: "Data from YouTube" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("isn't offered on platforms it can't look up", async ({ page }) => {
    await page.goto("/calculator?p=instagram&c=reel&pr=standard");
    await expect(page.getByRole("heading", { name: /How big is your Instagram audience/ })).toBeVisible();
    await expect(page.getByText("Fill this in from your channel")).toHaveCount(0);
  });

  test("YouTube estimates carry the not-endorsed disclaimer", async ({ page }) => {
    await page.goto("/calculator?p=youtube&c=integration&pr=standard&f=100000&v=20000&e=4&n=technology&l=us-ca&u=none");
    await expect(page.getByText("not provided, approved, or endorsed by YouTube or Google")).toBeVisible();
  });
});

test.describe("content pages", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("email templates copy to the clipboard", async ({ page }) => {
    await page.goto("/brand-deal-email-templates");
    await page.locator("#counter").getByRole("button", { name: "Copy template" }).click();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain("If [$their budget] is firm");
  });

  test("the hub links every calculator", async ({ page }) => {
    await page.goto("/calculators");
    const main = page.getByRole("main");
    await expect(main.getByRole("link", { name: /Exclusivity fee calculator/ })).toBeVisible();
    await expect(main.getByRole("link", { name: /YouTube Shorts sponsorship calculator/ })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Calculators");
  });

  test("landing pages start the calculator with their preset", async ({ page }) => {
    await page.goto("/instagram-reel-price-calculator");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("sponsored Reel");
    await expect(page.getByRole("heading", { name: "How much work is involved?" })).toBeVisible();
  });

  for (const path of [
    "/",
    "/calculator",
    "/calculators",
    "/methodology",
    "/privacy",
    "/terms",
    "/ugc-rate-calculator",
    "/whitelisting-calculator",
    "/exclusivity-fee-calculator",
    "/instagram-story-price-calculator",
    "/brand-deal-email-templates",
  ]) {
    test(`${path} renders without errors or horizontal scroll`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeAttached();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }
});
