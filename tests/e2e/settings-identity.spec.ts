import { expect, test } from "@playwright/test";

test.describe("Settings Device Identity & Privacy", () => {
  test("privacy section renders active deviceId and confirms reset modal lifecycle", async ({ page }) => {
    await page.goto("/settings");
    await page.evaluate(() => {
      localStorage.setItem("mdf_intro_seen", "1");
      localStorage.setItem("mdf_cookie_ok", "1");
      localStorage.setItem("mdf_device_id", "test-device-uuid-123456789");
    });
    await page.reload();

    // Verify Settings page loaded
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 10000 });

    // Verify Privacy & Device Identity section
    const privacyHeading = page.getByRole("heading", { name: "Privacy & Device Identity" });
    await expect(privacyHeading).toBeVisible({ timeout: 10000 });

    // Verify active device badge is visible
    await expect(page.getByText("Active")).toBeVisible();

    // Open Reset confirmation dialog
    const resetBtn = page.getByRole("button", { name: "Reset Device Identity" });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // Verify confirmation modal content
    const modalHeading = page.getByRole("heading", { name: "Reset device identity?" });
    await expect(modalHeading).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByText("This generates a new secure identifier for this device")
    ).toBeVisible();

    // Cancel the modal
    const cancelBtn = page.getByRole("button", { name: "Cancel" });
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Modal should close and original device ID should be preserved
    await expect(modalHeading).not.toBeVisible();
    const storedId = await page.evaluate(() => localStorage.getItem("mdf_device_id"));
    expect(storedId).toBe("test-device-uuid-123456789");
  });
});
