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

test("enable share, view anonymously, verify deviceId privacy, and rotate link", async ({ browser, page }) => {
  const noteContent = `Trail test note ${Date.now()}`;

  // Step 1: User visits /journal
  await page.goto("/journal");
  await page.evaluate(() => localStorage.setItem("mdf_intro_seen", "1"));

  // Add a note
  const noteInput = page.getByLabel("Add a note");
  await expect(noteInput).toBeVisible({ timeout: 10000 });
  await noteInput.fill(noteContent);
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText(noteContent)).toBeVisible({ timeout: 10000 });

  // Read the owner's deviceId
  const ownerDeviceId = await page.evaluate(() => localStorage.getItem("mdf_device_id"));
  expect(ownerDeviceId).toBeTruthy();

  // Enable live link
  const startShareBtn = page.getByRole("button", { name: "Start live link" });
  await startShareBtn.click();
  await expect(page.getByRole("button", { name: "Stop sharing" })).toBeVisible({ timeout: 10000 });

  // Get share URL text
  const shareUrlLocator = page.locator("p.break-all");
  await expect(shareUrlLocator).toBeVisible({ timeout: 10000 });
  const shareUrlText = await shareUrlLocator.innerText();
  expect(shareUrlText).toContain("/share/");

  // Step 2: In a completely separate anonymous context (no deviceId), view the shared journal
  const anonContext = await browser.newContext();
  const anonPage = await anonContext.newPage();

  await anonPage.goto(shareUrlText);
  await expect(anonPage.getByRole("heading", { name: "Shared Trip Journal" })).toBeVisible({ timeout: 10000 });
  await expect(anonPage.getByText(noteContent)).toBeVisible({ timeout: 10000 });
  await expect(anonPage.getByText("Live")).toBeVisible({ timeout: 10000 });

  // Privacy verification: the owner's deviceId must NEVER appear in the page content
  const pageHtml = await anonPage.content();
  expect(pageHtml).not.toContain(ownerDeviceId!);

  // Step 3: Rotate share link from owner page
  await page.getByRole("button", { name: "Create a new link" }).click();
  await expect(page.getByRole("heading", { name: "Create a new share link?" })).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: "Create new link" }).click();

  // Wait for new share URL to appear
  await page.waitForTimeout(1000);
  const newShareUrlText = await shareUrlLocator.innerText();
  expect(newShareUrlText).not.toBe(shareUrlText);

  // Old share URL in anonymous context should now be unavailable
  await anonPage.reload();
  await expect(
    anonPage.getByRole("heading", { name: "Shared journal unavailable" })
  ).toBeVisible({ timeout: 10000 });

  // New share URL works in anonymous context
  await anonPage.goto(newShareUrlText);
  await expect(anonPage.getByRole("heading", { name: "Shared Trip Journal" })).toBeVisible({ timeout: 10000 });
  await expect(anonPage.getByText(noteContent)).toBeVisible({ timeout: 10000 });

  await anonContext.close();
});
