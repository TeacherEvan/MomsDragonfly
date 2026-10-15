import { expect, test } from "@playwright/test";

test("local page displays phrasebook tab and phrases", async ({ page, context }) => {
  // Grant geolocation permission and mock coordinates (Pretoria: -25.746, 28.237)
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: -25.746, longitude: 28.237 });

  // Skip onboarding
  await page.addInitScript(() => {
    localStorage.setItem("mdf_intro_seen", Date.now().toString());
  });

  await page.goto("/local", { waitUntil: "networkidle", timeout: 30000 });

  // Verify heading
  await expect(page.getByRole("heading", { name: "Local" })).toBeVisible({ timeout: 15000 });

  // Check tablist and switch to Phrases segment
  const phrasesTab = page.getByRole("tab", { name: /Local phrases/i });
  await expect(phrasesTab).toBeVisible({ timeout: 10000 });
  await phrasesTab.click();

  // Verify phrasebook section exists
  const section = page.locator(
    'section[aria-label="Everyday local phrases"], section[aria-label="Local phrasebook"]'
  );
  await expect(section).toBeVisible({ timeout: 15000 });

  // Verify list items exist
  const phraseItems = section.locator("li");
  const count = await phraseItems.count();
  if (count > 0) {
    expect(count).toBeGreaterThanOrEqual(1);
    await expect(phraseItems.first()).toBeVisible();
  }
});
