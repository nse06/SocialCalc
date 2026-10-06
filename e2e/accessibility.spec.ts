import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

async function audit(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(summary).toEqual([]);
}

test.describe("accessibility", () => {
  for (const path of [
    "/",
    "/calculator",
    "/calculators",
    "/methodology",
    "/tiktok-rate-calculator",
    "/exclusivity-fee-calculator",
    "/brand-deal-email-templates",
    "/privacy",
  ]) {
    test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
      await page.goto(path);
      await audit(page);
    });
  }

  test("calculator inputs have no violations", async ({ page }) => {
    await page.goto("/calculator?p=instagram&c=reel&pr=standard");
    await page.getByRole("button", { name: "Continue" }).click(); // show validation errors too
    await audit(page);
  });

  test("results page has no violations", async ({ page }) => {
    await page.goto("/calculator?p=tiktok&c=sponsored&pr=standard&f=50000&e=5&n=general&l=us-ca&u=paid&ud=90d&x=30d");
    await expect(page.getByRole("heading", { name: "Your estimated rate" })).toBeVisible();
    await page.getByRole("button", { name: "Generate my quote" }).first().click();
    await expect(page.getByTestId("quote-preview")).toBeVisible();
    await page.waitForTimeout(800); // let the count-up settle
    await audit(page);
  });
});
