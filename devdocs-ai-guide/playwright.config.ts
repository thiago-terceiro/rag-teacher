import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E and Automated Axe Accessibility Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  timeout: 60000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5188',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run local dev server before starting the tests */
  webServer: {
    command: 'npm.cmd run dev -- --port 5188 --strictPort',
    url: 'http://localhost:5188',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
