import { test, expect } from "@playwright/test";

test("tickets page loads", async ({ page }) => {
  await page.goto("/tickets");
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  // Wait for dynamic import to hydrate
  await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible({ timeout: 30000 });
});

test("ticket gallery shows empty state", async ({ page }) => {
  await page.goto("/tickets");
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  // Wait for dynamic import to hydrate and empty state to appear
  await expect(page.getByText("No tickets saved")).toBeVisible({ timeout: 30000 });
});