import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'mobile-375', width: 375, height: 667 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'transition-1000', width: 1000, height: 800 },
  { name: 'desktop-lg-1024', width: 1024, height: 800 },
  { name: 'laptop-1150', width: 1150, height: 800 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'widescreen-1440', width: 1440, height: 900 },
];

test.describe('Visual Navbar Audit Across Breakpoints', () => {
  for (const vp of viewports) {
    test(`capture header at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/steps/project-setup');
      await page.waitForSelector('header');
      await page.waitForTimeout(500); // Allow fonts and styles to stabilize

      // Take screenshot of the top navbar
      const navbar = page.locator('header').first();
      await navbar.screenshot({ path: `test-results/screenshots/header-${vp.name}.png` });
      await page.screenshot({ path: `test-results/screenshots/page-${vp.name}.png` });

      // Check if Display button is visible and within viewport bounds
      const displayBtn = page.getByRole('button', { name: /display|accessibility/i });
      await expect(displayBtn).toBeVisible();
      const box = await displayBtn.boundingBox();
      const navBox = await navbar.boundingBox();
      expect(box).not.toBeNull();
      expect(navBox).not.toBeNull();
      if (box && navBox) {
        console.log(`[${vp.name}] Display button bounding box:`, JSON.stringify(box), `Navbar width:`, navBox.width, `Right edge:`, box.x + box.width, `Navbar right:`, navBox.x + navBox.width);
        // The Display button must be completely visible and inside the navbar width
        expect(box.x + box.width).toBeLessThanOrEqual(navBox.x + navBox.width + 1);
      }
    });
  }
});
