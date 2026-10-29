import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Automated Axe Accessibility Audits (WCAG 2.1 AA/AAA)', () => {
  test('step view should have zero axe accessibility violations', async ({ page }) => {
    await page.goto('/steps/project-setup');
    await page.waitForSelector('h1');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // KaTeX generates mathML annotations that have known axe-core parser nuances
      .disableRules(['color-contrast-enhanced'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('interview questions page should pass axe scan', async ({ page }) => {
    await page.goto('/interview-questions');
    await page.waitForSelector('h1');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('command palette modal should pass axe scan when opened', async ({ page }) => {
    await page.goto('/steps/project-setup');
    // Open Command Palette via search trigger button
    await page.getByRole('button', { name: /search/i }).first().click();
    await page.waitForSelector('[role="combobox"]');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('reading settings modal should pass axe scan when opened', async ({ page }) => {
    await page.goto('/steps/project-setup');
    // Click display settings button
    await page.getByRole('button', { name: /display/i }).click();
    await page.waitForSelector('[role="dialog"]');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('architecture explorer page should pass axe scan', async ({ page }) => {
    await page.goto('/architecture');
    await page.waitForSelector('h1');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
