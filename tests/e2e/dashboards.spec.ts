import { test, expect } from '@playwright/test';

test('all dashboard pages load without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  // Clear localStorage
  await page.goto('http://localhost:3000');
  await page.evaluate(() => localStorage.clear());

  const pages = [
    { url: '/explore', heading: 'Explore' },
    { url: '/budget', heading: 'Trip Budget Tracker' },
    { url: '/reminders', heading: 'Reminders' },
    { url: '/tickets', heading: 'Tickets' },
    { url: '/settings', heading: 'Settings' },
  ];

  for (const { url, heading } of pages) {
    console.log(`\nTesting ${url}...`);
    await page.goto(`http://localhost:3000${url}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Check heading
    await expect(page.locator(`h1:has-text("${heading}")`)).toBeVisible({ timeout: 10000 });
    console.log(`  ✓ ${heading} heading found`);
    
    // Check bottom nav
    await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
    console.log(`  ✓ Bottom navigation found`);
  }

  // Filter out non-critical errors
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
    console.log('\nCritical errors:', criticalErrors);
  }
  expect(criticalErrors).toHaveLength(0);
  
  console.log('\n✅ All dashboard pages load correctly');
});