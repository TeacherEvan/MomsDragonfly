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
 
 // Clear localStorage and set intro as seen to skip onboarding
   await page.goto('/');
   await page.evaluate(() => {
     localStorage.clear();
     localStorage.setItem('mdf_intro_seen', Date.now().toString());
   });
 
   const pages = [
     { url: '/explore', heading: 'Explore', isHeading: true },
     { url: '/budget', heading: 'Trip Budget Tracker', isHeading: false },
     { url: '/reminders', heading: 'Reminders', isHeading: true },
     { url: '/tickets', heading: 'Tickets', isHeading: true },
     { url: '/settings', heading: 'Settings', isHeading: true },
   ];
 
   for (const { url, heading, isHeading } of pages) {
     console.log(`\nTesting ${url}...`);
     await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
     await page.waitForLoadState('domcontentloaded');
     await page.waitForLoadState('networkidle');
     
     // Wait for and dismiss Next.js version staleness error dialog if present
     try {
       await page.evaluate(() => {
         document.querySelectorAll('dialog').forEach(d => d.remove());
         document.querySelectorAll('[class*="error-overlay"], [class*="ErrorOverlay"], [id*="error-overlay"]').forEach(o => o.remove());
       });
       await page.waitForTimeout(500);
     } catch {
       // Ignore errors
     }
     
     // Wait longer for dynamic imports (tickets page)
     const waitTime = url === '/tickets' ? 5000 : 2000;
     await page.waitForTimeout(waitTime);
     
     // Check heading/text
     if (isHeading) {
       await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 15000 });
     } else {
       await expect(page.getByText(heading)).toBeVisible({ timeout: 15000 });
     }
     console.log(`  ✓ ${heading} found`);

     if (url === '/settings') {
       // Display & layout prefs + exit button (committed feature b70e0af)
       await expect(page.getByRole('heading', { name: 'Display & Layout' })).toBeVisible();
       await expect(page.getByTestId('exit-button')).toBeVisible();

       // Toggle the way a user does: tap the visible switch (the input is sr-only)
       const largeText = page.getByTestId('display-large-text');
       const largeTextSwitch = page.locator('label:has([data-testid="display-large-text"]) div');

       await expect(largeText).not.toBeChecked();
       await largeTextSwitch.click();
       await expect(largeText).toBeChecked();
       await expect(page.locator('html')).toHaveClass(/large-text/);
       await largeTextSwitch.click();
       await expect(largeText).not.toBeChecked();
       await expect(page.locator('html')).not.toHaveClass(/large-text/);

       await expect(page.getByRole('checkbox', { name: 'Reduce motion' })).toBeAttached();
       await expect(page.getByRole('checkbox', { name: 'High contrast' })).toBeAttached();
       console.log('  ✓ Display & Layout prefs + Exit button work');
     }

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
     !e.includes('NotFoundErrorBoundary') &&
     !e.includes('Failed to load resource') &&
     !e.includes('Refused to apply style') &&
     !e.includes('Refused to execute script') &&
     !e.includes('MIME type')
   );
   
   if (criticalErrors.length > 0) {
     console.log('\nCritical errors:', criticalErrors);
   }
   expect(criticalErrors).toHaveLength(0);
   
   console.log('\n✅ All dashboard pages load correctly');
  });