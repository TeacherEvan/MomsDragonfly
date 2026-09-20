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
  console.log('Has Welcome:', html.includes('Welcome to Mom'));
  console.log('Has Explore:', html.includes('Explore'));
  console.log('Has error:', html.includes('Application error'));
});
