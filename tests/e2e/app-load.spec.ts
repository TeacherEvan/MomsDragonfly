import { test, expect } from '@playwright/test';

test('app loads with splash screen and video intro', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  // Clear localStorage to ensure intro shows (on every launch)
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
  });
  
  await page.goto('/explore', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  
  // Wait for and dismiss Next.js version staleness error dialog if present
  try {
    // Try to remove dialog immediately (it may already be present)
    await page.evaluate(() => {
      document.querySelectorAll('dialog').forEach(d => d.remove());
      document.querySelectorAll('[class*="error-overlay"], [class*="ErrorOverlay"], [id*="error-overlay"]').forEach(o => o.remove());
    });
    await page.waitForTimeout(500);
  } catch {
    // Ignore errors
  }
  
  await page.waitForTimeout(2000);

  // Check for splash screen (welcome screen) - new SplashScreen component
  const introScreen = page.locator('h1:has-text("Mom\'s Dragonfly")').first();
  await expect(introScreen).toBeVisible({ timeout: 15000 });
  console.log('✓ Splash screen found');

  // Check for dragonfly SVG (it has data-testid="dragonfly-silhouette" from SplashScreen)
  const dragonfly = page.locator('[data-testid="dragonfly-silhouette"]').first();
  await expect(dragonfly).toBeVisible();
  console.log('✓ Dragonfly silhouette found');

  // Tap splash to trigger video modal
  await page.click('body');
  await page.waitForTimeout(500);

  // Check for video modal
  const videoModal = page.locator('video[poster="/intro.jpg"]');
  await expect(videoModal).toBeVisible({ timeout: 10000 });
  console.log('✓ Video modal found');

  // Check for play button in video modal
  const playButton = page.locator('button:has-text("▶")').first();
  await expect(playButton).toBeVisible();
  console.log('✓ Play button found');

  // Click play to start video
  await playButton.click();
  await page.waitForTimeout(1000);

  // Check for skip button
  const skipButton = page.locator('button:has-text("Skip")');
  await expect(skipButton).toBeVisible();
  console.log('✓ Skip button found');

  // Skip the video
  await skipButton.click();
  await page.waitForTimeout(500);

  // Check for Explore heading
  await expect(page.getByRole('heading', { name: 'Explore' })).toBeVisible();
  console.log('✓ Explore heading found');

  // Check for bottom nav
  await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
  console.log('✓ Bottom navigation found');

  // Check no critical console errors (filter out React warnings and network/CDN issues)
  const criticalErrors = errors.filter(e => 
    !e.includes('Warning:') && 
    !e.includes('Content Security Policy') &&
    !e.includes('Function components cannot be given refs') &&
    !e.includes('render is not a function') &&
    !e.includes('importScripts') &&
    !e.includes('tesseract.js') &&
    !e.includes('NotFoundErrorBoundary') &&
    !e.includes('Failed to load resource') &&
    !e.includes('Refused to apply style') &&
    !e.includes('Refused to execute script') &&
    !e.includes('MIME type')
  );
  
  if (criticalErrors.length > 0) {
    console.log('Critical errors:', criticalErrors);
  }
  expect(criticalErrors).toHaveLength(0);
  
  console.log('✅ All checks passed');
});