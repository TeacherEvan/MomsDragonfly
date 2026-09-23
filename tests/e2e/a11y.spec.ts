import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/explore", "/budget", "/reminders", "/tickets", "/settings"];

for (const url of PAGES) {
  test(`${url} has no critical accessibility violations`, async ({ page }) => {
    await page.goto(url);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
  });

  test(`${url} in elderly mode has no critical accessibility violations`, async ({ page }) => {
    await page.goto(url);
    // Enable elderly mode
    await page.evaluate(() => document.documentElement.classList.add("elderly"));
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations.filter((v) => v.impact === "critical")).toHaveLength(0);
  });
}