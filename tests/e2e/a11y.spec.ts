import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = [
  "/explore",
  "/local",
  "/journal",
  "/budget",
  "/reminders",
  "/tickets",
  "/settings",
];

for (const url of PAGES) {
  test(`${url} has no critical or serious accessibility violations`, async ({ page }) => {
    await page.goto(url);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`)).toEqual([]);
  });

  test(`${url} in largeText/elderly mode has no critical or serious accessibility violations`, async ({ page }) => {
    await page.goto(url);
    await page.evaluate(() => {
      document.documentElement.classList.add("elderly");
      document.documentElement.classList.add("large-text");
    });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`)).toEqual([]);
  });
}