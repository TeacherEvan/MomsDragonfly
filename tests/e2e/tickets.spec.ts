import { test, expect } from "@playwright/test";

test("tickets page loads", async ({ page }) => {
  await page.goto("/tickets");
  await expect(page.getByRole("heading", { name: "Tickets" })).toBeVisible();
});

test("ticket gallery shows empty state", async ({ page }) => {
  await page.goto("/tickets");
  await expect(page.getByText("No tickets yet")).toBeVisible();
});