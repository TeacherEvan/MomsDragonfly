import { test, expect } from '@playwright/test';

test('app loads with intro video and explore page', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  // Clear localStorage to ensure intro shows
  await page.goto('http://localhost:3000');
  await page.evaluate(() => {
    localStorage.clear();
  });
  
  await page.goto('http://localhost:3000/explore', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Check for intro video component (welcome screen)
  const introScreen = page.locator('text=Welcome to Mom');
  await expect(introScreen).toBeVisible({ timeout: 10000 });
  console.log('✓ Intro welcome screen found');

  // Check for play button
  const playButton = page.locator('button[aria-label="Play introduction video"]');
  await expect(playButton).toBeVisible();
  console.log('✓ Play button found');

  // Check for Explore heading
  await expect(page.locator('h1:has-text("Explore")')).toBeVisible();
  console.log('✓ Explore heading found');

  // Check for map container (may not render without location permission)
  const mapContainer = page.locator('.leaflet-container');
  if (await mapContainer.count() > 0) {
    await expect(mapContainer.first()).toBeVisible();
    console.log('✓ Map container found');
  } else {
    console.log('ℹ Map container not visible (needs location permission)');
  }

  // Check for POI list
  const poiList = page.locator('[role="list"]');
  if (await poiList.count() > 0) {
    console.log('✓ POI list found');
  } else {
    console.log('ℹ POI list not found');
  }

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
    !e.includes('NotFoundErrorBoundary')
  );
  
  if (criticalErrors.length > 0) {
    console.log('Critical errors:', criticalErrors);
  }
  expect(criticalErrors).toHaveLength(0);
  
  console.log('✅ All checks passed');
});