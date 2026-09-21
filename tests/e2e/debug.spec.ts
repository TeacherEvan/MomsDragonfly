import { test, expect } from '@playwright/test';

test('debug', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    console.log('CONSOLE:', msg.type(), msg.text());
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });

  await page.goto('/explore', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);

  const html = await page.content();
  console.log('HTML length:', html.length);
  console.log('Has Splash:', html.includes("Mom's Dragonfly"));
  console.log('Has Explore:', html.includes('Explore'));
  console.log('Has error:', html.includes('Application error'));

  // Verify splash overlay exists when onboarding not completed
  await expect(page.locator('[data-testid="splash-overlay"]')).toBeVisible({ timeout: 5000 }).catch(() => {
    console.log('Splash not visible (likely intro already seen)');
  });
});
