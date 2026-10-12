import { expect, test } from "@playwright/test";

test("share page rejects a malformed token immediately", async ({ page }) => {
  await page.goto("/share/not-a-real-token");
  await expect(
    page.getByRole("heading", { name: "Shared journal unavailable" })
  ).toBeVisible({ timeout: 10000 });
});

test("share page rejects an unknown well-formed token after timeout", async ({ page }) => {
  await page.goto("/share/123e4567-e89b-42d3-a456-426614174000");
  await expect(
    page.getByRole("heading", { name: "Shared journal unavailable" })
  ).toBeVisible({ timeout: 10000 });
});

test("journal share controls and deviceId privacy in DOM", async ({ page }) => {
  await page.goto("/journal");
  await page.evaluate(() => {
    localStorage.setItem("mdf_intro_seen", "1");
    localStorage.setItem("mdf_cookie_ok", "1");
  });

  // Verify journal loaded and share controls exist
  await expect(page.getByRole("heading", { name: "Trip Journal" })).toBeVisible({ timeout: 10000 });
  const shareSection = page.getByRole("region", { name: "Share trip journal" });
  await expect(shareSection).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("button", { name: "Start live link" })).toBeVisible({ timeout: 10000 });

  // Verify note input is available
  const noteInput = page.getByLabel("Add a note");
  await expect(noteInput).toBeVisible({ timeout: 10000 });

  // Read deviceId from localStorage
  const deviceId = await page.evaluate(() => localStorage.getItem("mdf_device_id"));
  expect(deviceId).toBeTruthy();

  // Verify deviceId is never displayed or leaked into DOM elements
  const pageHtml = await page.content();
  // DeviceId should only exist inside localStorage, not anywhere in the rendered HTML markup
  const htmlWithoutStorage = pageHtml.replace(new RegExp(`"mdf_device_id"`, "g"), "");
  expect(htmlWithoutStorage).not.toContain(deviceId!);
});

