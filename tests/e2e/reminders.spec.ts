import { test, expect } from "@playwright/test";

test("reminders page loads", async ({ page }) => {
  await page.goto("/reminders");
  await expect(page.getByRole("heading", { name: "Reminders" })).toBeVisible();
});

test("can navigate to reminders via bottom nav", async ({ page }) => {
  await page.goto("/explore");
  await page.getByRole("link", { name: "Reminders" }).click();
  await expect(page).toHaveURL(/\/reminders/);
});