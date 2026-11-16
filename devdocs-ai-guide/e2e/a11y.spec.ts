import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type ThemePreset = 'daylight-paper' | 'deep-blue' | 'oled-midnight';

const ALL_THEMES: ThemePreset[] = ['daylight-paper', 'deep-blue', 'oled-midnight'];
const AAA_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
  'wcag2aaa',
  'wcag21aaa',
  'best-practice',
];

async function applyThemeAndNavigate(page: Page, path: string, theme: ThemePreset) {
  await page.addInitScript((t) => {
    try {
      const existingRaw = window.localStorage.getItem('rag_reading_settings_v1');
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      window.localStorage.setItem(
        'rag_reading_settings_v1',
        JSON.stringify({ ...existing, theme: t })
      );
    } catch {
      window.localStorage.setItem('rag_reading_settings_v1', JSON.stringify({ theme: t }));
    }
  }, theme);

  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('html')).toHaveClass(new RegExp(`theme-${theme}`));
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
}

async function waitForUiSettled(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      })
  );
  // Wait for CSS transitions / short drawer reveals to settle
  await page.waitForTimeout(350);
}

async function runFullWcagAAA(page: Page, label: string) {
  await waitForUiSettled(page);
  const results = await new AxeBuilder({ page }).withTags(AAA_TAGS).analyze();
  const formatted = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    nodes: v.nodes.slice(0, 5).map((n) => ({
      target: n.target,
      failureSummary: n.failureSummary,
    })),
  }));
  expect(formatted, `WCAG 2.1/2.2 AAA violations on ${label}`).toEqual([]);
}

async function assertTouchTargetsAndAriaAndCodeContrast(page: Page, label: string) {
  const report = await page.evaluate(() => {
    const parseColor = (str: string): [number, number, number, number] | null => {
      const match = str.match(/rgba?\(([^)]+)\)/);
      if (!match) return null;
      const parts = match[1].split(',').map((s) => parseFloat(s.trim()));
      if (parts.length < 3) return null;
      return [parts[0], parts[1], parts[2], parts.length >= 4 && !Number.isNaN(parts[3]) ? parts[3] : 1];
    };

    const blendOver = (
      fg: [number, number, number, number],
      bg: [number, number, number]
    ): [number, number, number] => {
      const a = fg[3];
      return [
        fg[0] * a + bg[0] * (1 - a),
        fg[1] * a + bg[1] * (1 - a),
        fg[2] * a + bg[2] * (1 - a),
      ];
    };

    const luminance = (rgb: [number, number, number]): number => {
      const chan = rgb.map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
    };

    const contrastRatio = (a: [number, number, number], b: [number, number, number]): number => {
      const l1 = luminance(a);
      const l2 = luminance(b);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };

    const getEffectiveBg = (el: Element): [number, number, number] => {
      const stack: [number, number, number, number][] = [];
      let cur: Element | null = el;
      while (cur) {
        const bgStr = getComputedStyle(cur).backgroundColor;
        const parsed = parseColor(bgStr);
        if (parsed && parsed[3] > 0) {
          stack.push(parsed);
        }
        cur = cur.parentElement;
      }
      const isDark = document.documentElement.classList.contains('dark');
      let acc: [number, number, number] = isDark ? [9, 13, 22] : [250, 248, 245];
      for (let i = stack.length - 1; i >= 0; i--) {
        acc = blendOver(stack[i], acc);
      }
      return acc;
    };

    // 1. Check 44x44px touch targets on non-prose interactive elements
    const smallTargets: Array<{ tag: string; text: string; w: number; h: number }> = [];
    const selector =
      'button, [role="button"], [role="radio"], [role="checkbox"], [role="option"], [role="switch"], select, input:not([type="hidden"]), textarea, a[href]';
    document.querySelectorAll(selector).forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.closest('.prose') && el.tagName.toLowerCase() === 'a') return;
      if (htmlEl.getAttribute('aria-hidden') === 'true') return;
      if (htmlEl.getAttribute('tabindex') === '-1' && getComputedStyle(htmlEl).opacity === '0') return;
      const style = getComputedStyle(htmlEl);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
      if (htmlEl.hasAttribute('disabled') || htmlEl.getAttribute('aria-disabled') === 'true') return;
      if (htmlEl.classList.contains('sr-only') || (style.clip === 'rect(0px, 0px, 0px, 0px)' && style.overflow === 'hidden')) return;
      const rect = htmlEl.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (rect.width < 43.5 || rect.height < 43.5) {
        smallTargets.push({
          tag: `${el.tagName.toLowerCase()}${el.getAttribute('role') ? `[role=${el.getAttribute('role')}]` : ''}`,
          text: (htmlEl.getAttribute('aria-label') || htmlEl.innerText || '').trim().slice(0, 50),
          w: Math.round(rect.width * 10) / 10,
          h: Math.round(rect.height * 10) / 10,
        });
      }
    });

    // 2. Check no orphaned role="tab"
    const orphanedTabs: string[] = [];
    document.querySelectorAll('[role="tab"]').forEach((tab) => {
      const tablist = tab.closest('[role="tablist"]');
      const controls = tab.getAttribute('aria-controls');
      const panel = controls ? document.getElementById(controls) : null;
      if (!tablist || !panel || panel.getAttribute('role') !== 'tabpanel') {
        orphanedTabs.push((tab as HTMLElement).innerText.trim().slice(0, 40));
      }
    });

    // 3. Check all visible <pre>, <code>, and syntax-highlighted tokens meet >= 7.0:1 (AAA normal text)
    const lowContrastCode: Array<{ sample: string; ratio: number; fg: string; bg: number[] }> = [];
    const checkedNodes = new Set<Element>();
    document.querySelectorAll('pre, pre span, pre code, code, textarea.font-mono').forEach((el) => {
      if (checkedNodes.has(el)) return;
      checkedNodes.add(el);
      const htmlEl = el as HTMLElement;
      const style = getComputedStyle(htmlEl);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return;
      const rect = htmlEl.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const hasDirectText = Array.from(htmlEl.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0
      );
      if (!hasDirectText && el.tagName.toLowerCase() !== 'textarea') return;

      const fgParsed = parseColor(style.color);
      if (!fgParsed) return;
      const bgRgb = getEffectiveBg(el);
      const fgRgb = blendOver(fgParsed, bgRgb);
      const ratio = contrastRatio(fgRgb, bgRgb);
      const fontSize = parseFloat(style.fontSize) || 14;
      const fontWeight = parseInt(style.fontWeight, 10) || 400;
      const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      const minRatio = isLarge ? 4.5 : 7.0;
      if (ratio < minRatio) {
        lowContrastCode.push({
          sample: (htmlEl.textContent || (htmlEl as HTMLTextAreaElement).value || '').trim().slice(0, 40),
          ratio: Math.round(ratio * 100) / 100,
          fg: style.color,
          bg: bgRgb.map((v) => Math.round(v)),
        });
      }
    });

    // 4. WCAG 2.5.3 Label in Name check for visible controls with explicit aria-label
    const labelInNameMismatches: Array<{ visible: string; ariaLabel: string }> = [];
    document
      .querySelectorAll('button[aria-label], a[aria-label], [role="button"][aria-label], [role="radio"][aria-label]')
      .forEach((el) => {
        const htmlEl = el as HTMLElement;
        const style = getComputedStyle(htmlEl);
        if (style.display === 'none' || style.visibility === 'hidden') return;
        const rect = htmlEl.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let rawText = '';
        let prevParent: Element | null = null;
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const parent = node.parentElement;
          if (!parent) continue;
          if (parent.closest('[aria-hidden="true"], .sr-only')) continue;
          const ps = getComputedStyle(parent);
          if (ps.display === 'none' || ps.visibility === 'hidden') continue;
          const txt = node.textContent || '';
          if (!txt.trim()) continue;
          if (prevParent && prevParent !== parent && !/\s$/.test(rawText) && !/^\s/.test(txt)) {
            rawText += ' ';
          }
          rawText += txt;
          prevParent = parent;
        }
        const visibleText = rawText.replace(/\s+/g, ' ').trim().toLowerCase();
        if (!visibleText || visibleText.length < 2) return;
        const ariaLabel = (htmlEl.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (ariaLabel && !ariaLabel.includes(visibleText)) {
          labelInNameMismatches.push({ visible: visibleText, ariaLabel });
        }
      });

    return { smallTargets, orphanedTabs, lowContrastCode, labelInNameMismatches };
  });

  expect(report.smallTargets, `Interactive controls < 44x44px on ${label}`).toEqual([]);
  expect(report.orphanedTabs, `Orphaned role="tab" elements on ${label}`).toEqual([]);
  expect(report.lowContrastCode, `Low contrast (< 7:1 AAA) code/mono text on ${label}`).toEqual([]);
  expect(report.labelInNameMismatches, `WCAG 2.5.3 Label in Name mismatch on ${label}`).toEqual([]);
}

test.describe('WCAG 2.1/2.2 Level AAA Audit Across All Themes', () => {
  for (const theme of ALL_THEMES) {
    test(`Curriculum steps, code blocks, calculators & Mermaid (${theme})`, async ({ page }) => {
      // 1. Setup step: bash/code blocks + tables + quiz + notes
      await applyThemeAndNavigate(page, '/steps/project-setup', theme);
      await runFullWcagAAA(page, `${theme}: /steps/project-setup`);
      await assertTouchTargetsAndAriaAndCodeContrast(page, `${theme}: /steps/project-setup`);

      // Toggle Mermaid diagram to Source mode and audit Fullscreen modal & calculator
      await applyThemeAndNavigate(page, '/steps/chunking-fixed-size', theme);
      await expect(page.getByRole('heading', { name: /Chunking Overlap/i })).toBeVisible({ timeout: 10000 });
      await runFullWcagAAA(page, `${theme}: /steps/chunking-fixed-size`);
      await assertTouchTargetsAndAriaAndCodeContrast(page, `${theme}: /steps/chunking-fixed-size`);

      const fullscreenBtn = page.getByRole('button', { name: /Open diagram in full screen modal/i }).first();
      if (await fullscreenBtn.count()) {
        await fullscreenBtn.click();
        await expect(page.getByRole('dialog', { name: /Fullscreen Architecture Diagram/i })).toBeVisible();
        await runFullWcagAAA(page, `${theme}: Mermaid Fullscreen Modal`);
        await assertTouchTargetsAndAriaAndCodeContrast(page, `${theme}: Mermaid Fullscreen Modal`);
        await page.keyboard.press('Escape');
      }

      // Switch Mermaid diagram to Source mode and audit code readability
      const sourceBtn = page.getByRole('button', { name: /Source — View diagram source code/i }).first();
      if (await sourceBtn.count()) {
        await sourceBtn.click();
        await runFullWcagAAA(page, `${theme}: /steps/chunking-fixed-size (Mermaid Source)`);
        await assertTouchTargetsAndAriaAndCodeContrast(page, `${theme}: /steps/chunking-fixed-size (Mermaid Source)`);
      }

      // 2. Hybrid search step with RRF simulator, answered Knowledge Check quiz & tables
      await applyThemeAndNavigate(page, '/steps/agent-tool-doc-search', theme);
      await expect(page.getByRole('heading', { level: 2, name: /Reciprocal Rank Fusion/i })).toBeVisible({ timeout: 10000 });
      const firstQuizOption = page.locator('fieldset button[role="radio"]').first();
      if (await firstQuizOption.count()) {
        await firstQuizOption.click();
      }
      await runFullWcagAAA(page, `${theme}: /steps/agent-tool-doc-search (Answered Quiz + RRF)`);
      await assertTouchTargetsAndAriaAndCodeContrast(page, `${theme}: /steps/agent-tool-doc-search (Answered Quiz + RRF)`);
    });

    test(`Architecture Explorer stages & code payload panes (${theme})`, async ({ page }) => {
      await applyThemeAndNavigate(page, '/architecture', theme);
      await runFullWcagAAA(page, `${theme}: /architecture (Stage 1)`);
      await assertTouchTargetsAndAriaAndCodeContrast(page, `${theme}: /architecture (Stage 1)`);

      // Advance to Stage 2 & Stage 5 where encrypted/unhighlighted vs active payloads appear
      const nextBtn = page.getByRole('button', { name: /Next Step/i });
      await nextBtn.click();
      await runFullWcagAAA(page, `${theme}: /architecture (Stage 2)`);
      await assertTouchTargetsAndAriaAndCodeContrast(page, `${theme}: /architecture (Stage 2)`);

      await nextBtn.click();
      await nextBtn.click();
      await nextBtn.click();
      await runFullWcagAAA(page, `${theme}: /architecture (Stage 5)`);
      await assertTouchTargetsAndAriaAndCodeContrast(page, `${theme}: /architecture (Stage 5)`);
    });

    test(`Interview Questions view & expanded architecture answers (${theme})`, async ({ page }) => {
      await applyThemeAndNavigate(page, '/interview-questions', theme);
      await runFullWcagAAA(page, `${theme}: /interview-questions`);
      await assertTouchTargetsAndAriaAndCodeContrast(page, `${theme}: /interview-questions`);

      const revealBtn = page.getByRole('button', { name: /Reveal Architecture Answer/i }).first();
      await revealBtn.click();
      await runFullWcagAAA(page, `${theme}: /interview-questions (Answer Expanded)`);
      await assertTouchTargetsAndAriaAndCodeContrast(page, `${theme}: /interview-questions (Answer Expanded)`);
    });

    test(`Interactive Modals: Reading Settings, Command Palette, Vector Sandbox, Python Sandbox (${theme})`, async ({ page }) => {
      await applyThemeAndNavigate(page, '/steps/dense-retrieval', theme);

      // Reading Settings Modal
      await page.getByRole('button', { name: /Display/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await runFullWcagAAA(page, `${theme}: ReadingSettingsModal`);
      await assertTouchTargetsAndAriaAndCodeContrast(page, `${theme}: ReadingSettingsModal`);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toBeHidden();

      // Command Palette
      await page.getByRole('button', { name: /Search/i }).first().click();
      const combobox = page.getByRole('combobox', { name: /Search curriculum/i });
      await expect(combobox).toBeVisible();
      await combobox.fill('chunk');
      await runFullWcagAAA(page, `${theme}: CommandPalette`);
      await assertTouchTargetsAndAriaAndCodeContrast(page, `${theme}: CommandPalette`);
      await page.keyboard.press('Escape');

      // 2D Vector Distance Sandbox
      await page.getByRole('button', { name: /Launch Sandbox/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await runFullWcagAAA(page, `${theme}: VectorVisualizer`);
      await assertTouchTargetsAndAriaAndCodeContrast(page, `${theme}: VectorVisualizer`);
      await page.keyboard.press('Escape');

      // AirGap Python Lab Sandbox
      await page.getByRole('button', { name: /Python Lab/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await runFullWcagAAA(page, `${theme}: PythonSandbox`);
      await assertTouchTargetsAndAriaAndCodeContrast(page, `${theme}: PythonSandbox`);
    });
  }

  test('All 28 curriculum steps exhaustive AAA & code-box sweep across daylight-paper and dark themes', async ({ page }) => {
    test.setTimeout(180_000);
    await applyThemeAndNavigate(page, '/steps/project-setup', 'daylight-paper');

    const stepHrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLAnchorElement>('#curriculum-sidebar nav a[href^="/steps/"]')).map(
        (a) => a.getAttribute('href') || ''
      )
    );
    expect(stepHrefs.length).toBe(28);

    // Exhaustive daylight-paper audit across all 28 steps
    for (const href of stepHrefs) {
      await page.locator(`#curriculum-sidebar nav a[href="${href}"]`).click();
      await expect(page.locator('h1').first()).toBeVisible();
      await assertTouchTargetsAndAriaAndCodeContrast(page, `daylight-paper: ${href}`);
      await runFullWcagAAA(page, `daylight-paper: ${href}`);
    }

    // Code-box contrast & interactive checks across all 28 steps in deep-blue & oled-midnight
    for (const theme of ['deep-blue', 'oled-midnight'] as const) {
      await applyThemeAndNavigate(page, '/steps/project-setup', theme);
      for (const href of stepHrefs) {
        await page.locator(`#curriculum-sidebar nav a[href="${href}"]`).click();
        await expect(page.locator('h1').first()).toBeVisible();
        await assertTouchTargetsAndAriaAndCodeContrast(page, `${theme}: ${href}`);
      }
    }
  });

  test('Mobile viewport (390x844) daylight-paper & drawer AAA check', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await applyThemeAndNavigate(page, '/steps/project-setup', 'daylight-paper');
    await runFullWcagAAA(page, 'Mobile daylight-paper: /steps/project-setup');
    await assertTouchTargetsAndAriaAndCodeContrast(page, 'Mobile daylight-paper: /steps/project-setup');

    await page.getByRole('button', { name: /Open navigation menu/i }).click();
    await runFullWcagAAA(page, 'Mobile daylight-paper: Navigation Drawer');
    await assertTouchTargetsAndAriaAndCodeContrast(page, 'Mobile daylight-paper: Navigation Drawer');
  });

  test('Keyboard navigation, skip link, and Escape focus restoration', async ({ page }) => {
    await applyThemeAndNavigate(page, '/steps/project-setup', 'daylight-paper');

    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: /Skip to main content/i });
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');

    const mainRegion = page.locator('#main-scroll-container');
    await expect(mainRegion).toBeFocused();

    const displayBtn = page.getByRole('button', { name: /Display/i });
    await displayBtn.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(displayBtn).toBeFocused();
  });
});
