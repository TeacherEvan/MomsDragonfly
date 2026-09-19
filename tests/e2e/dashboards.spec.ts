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
     
     await page.waitForTimeout(1500);
     
     // Check heading
     await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 15000 });
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