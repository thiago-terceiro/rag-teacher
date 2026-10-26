import { test, expect } from '@playwright/test';

test.describe('Curriculum Navigation & User Journeys (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('BROWSER ERROR:', msg.text());
      }
    });
    page.on('pageerror', err => {
      console.error('PAGE ERROR EXCEPTION:', err.message);
    });
  });

  test('should load default step and redirect to /steps/project-setup', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/steps\/project-setup/);
    await expect(page.locator('h1')).toContainText('Project Setup & Python Environment');
  });

  test('should navigate to next step using arrow key and update breadcrumb', async ({ page }) => {
    await page.goto('/steps/project-setup');
    await page.waitForSelector('h1');

    // Click inside body so focus isn't in an input
    await page.click('body');
    await page.keyboard.press('ArrowRight');

    await expect(page).toHaveURL(/\/steps\/corpus-understanding/);
    await expect(page.locator('h1')).toContainText('Understanding the Corpus');
  });

  test('should update step status and reflect in progress ring', async ({ page }) => {
    await page.goto('/steps/project-setup');

    // Click 'Completed' radio button
    const completedBtn = page.getByRole('radio', { name: /completed/i });
    await completedBtn.click();
    await expect(completedBtn).toHaveAttribute('aria-checked', 'true');

    // Progress counter should increment
    const statsCounter = page.locator('header').getByText(/1 \/ 28/);
    await expect(statsCounter).toBeVisible();
  });

  test('should switch languages between English, Portuguese (Brazil), and Spanish', async ({ page }) => {
    await page.goto('/steps/project-setup');

    // Open Reading & Display settings modal
    await page.getByRole('button', { name: /display/i }).click();
    await page.waitForSelector('[role="dialog"]');

    // Select Português (Brasil) radio
    await page.getByRole('radio', { name: /português/i }).click();

    // Close modal
    await page.keyboard.press('Escape');

    // Verify document lang attribute and header translation
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.getByText('Masterclass Interativo')).toBeVisible();

    // Reopen and switch to Spanish
    await page.getByRole('button', { name: /display|configurações|exibição/i }).click();
    await page.waitForSelector('[role="dialog"]');
    await page.getByRole('radio', { name: /español/i }).click();
    await page.keyboard.press('Escape');

    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByText('Clase Magistral Interactiva')).toBeVisible();
  });

  test('should search topics in Command Palette and navigate to result', async ({ page }) => {
    await page.goto('/steps/project-setup');

    // Open Command Palette via search trigger button
    await page.getByRole('button', { name: /search/i }).first().click();
    const input = page.getByRole('combobox');
    await expect(input).toBeVisible();

    // Search for 'HNSW'
    await input.fill('HNSW');
    await page.waitForSelector('#command-palette-results button');

    // Press Enter to select the first result
    await page.keyboard.press('Enter');

    // Expect to navigate to qdrant-setup
    await expect(page).toHaveURL(/qdrant-setup/);
  });
});
