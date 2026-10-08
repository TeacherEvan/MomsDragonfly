import { expect, test } from "@playwright/test";

test("share page rejects a malformed token", async ({ page }) => {
  await page.goto("/share/not-a-real-token");
  await expect(
    page.getByRole("heading", { name: "Shared journal unavailable" })
  ).toBeVisible({ timeout: 10000 });
});

test("share page rejects an unknown well-formed token", async ({ page }) => {
  await page.goto("/share/123e4567-e89b-42d3-a456-426614174000");
  await expect(
    page.getByRole("heading", { name: "Shared journal unavailable" })
  ).toBeVisible({ timeout: 10000 });
});
