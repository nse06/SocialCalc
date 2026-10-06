import { type Page, expect, test } from "@playwright/test";

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

test.describe("content pages", () => {
  test("landing pages start the calculator with their preset", async ({ page }) => {
    await page.goto("/instagram-reel-price-calculator");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("sponsored Reel");
    await expect(page.getByRole("heading", { name: "How much work is involved?" })).toBeVisible();
  });

  for (const path of ["/", "/calculator", "/methodology", "/privacy", "/ugc-rate-calculator", "/whitelisting-calculator"]) {
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
