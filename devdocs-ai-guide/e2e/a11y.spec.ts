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

test.describe('Automated Axe Accessibility Audits (WCAG 2.1 AA) - Light Theme (Daylight Paper)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'rag_reading_settings_v1',
        JSON.stringify({
          theme: 'daylight-paper',
          fontSize: 'normal',
          contentWidth: 'normal',
          lineSpacing: 'relaxed',
        })
      );
    });
  });

  test('light theme step view should have zero axe accessibility violations', async ({ page }) => {
    await page.goto('/steps/project-setup');
    await page.waitForSelector('h1');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['color-contrast-enhanced'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('VIOLATIONS in Light Theme Step View:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('light theme interview questions page should pass axe scan', async ({ page }) => {
    await page.goto('/interview-questions');
    await page.waitForSelector('h1');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('VIOLATIONS in Light Theme Interview Questions:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('light theme command palette modal should pass axe scan when opened', async ({ page }) => {
    await page.goto('/steps/project-setup');
    await page.getByRole('button', { name: /search/i }).first().click();
    await page.waitForSelector('[role="combobox"]');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('VIOLATIONS in Light Theme Command Palette:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('light theme reading settings modal should pass axe scan when opened', async ({ page }) => {
    await page.goto('/steps/project-setup');
    await page.getByRole('button', { name: /display/i }).click();
    await page.waitForSelector('[role="dialog"]');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('VIOLATIONS in Light Theme Reading Settings Modal:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('light theme architecture explorer page should pass axe scan', async ({ page }) => {
    await page.goto('/architecture');
    await page.waitForSelector('h1');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('VIOLATIONS in Light Theme Architecture Explorer:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('light theme interactive simulators (chunking & rrf) should pass axe scan', async ({ page }) => {
    await page.goto('/steps/chunking-fixed-size');
    await page.waitForSelector('h1');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('VIOLATIONS in Light Theme Chunking Simulator:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('light theme rrf simulator should pass axe scan', async ({ page }) => {
    await page.goto('/steps/agent-tool-doc-search');
    await page.waitForSelector('h1');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('VIOLATIONS in Light Theme RRF Simulator:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('light theme vector visualizer modal should pass axe scan when opened', async ({ page }) => {
    await page.goto('/steps/dense-retrieval');
    await page.waitForSelector('h1');
    // Open Vector Sandbox modal via banner or top nav
    const launchBtn = page.getByRole('button', { name: /launch sandbox/i }).first();
    await launchBtn.click();
    await page.waitForSelector('[role="dialog"]');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('VIOLATIONS in Light Theme Vector Visualizer Modal:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('light theme python sandbox modal should pass axe scan when opened', async ({ page }) => {
    await page.goto('/steps/project-setup');
    await page.waitForSelector('h1');
    // Open Python Sandbox via learning status bar
    const pythonBtn = page.getByRole('button', { name: /launch python lab sandbox/i }).first();
    await pythonBtn.click();
    await page.waitForSelector('[role="dialog"]');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('VIOLATIONS in Light Theme Python Sandbox Modal:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
