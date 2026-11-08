/**
 * Playwright e2e config (T2.10): Chromium only for v0.2 (Firefox/WebKit
 * tracked separately). Two viewport projects — desktop and mobile-ish.
 *
 * Tests serve the BUILT site (`pnpm preview` on the /dexforge base) because
 * the dev server has a known hydration race; run `pnpm build` first — the
 * `test:e2e` script does that. In CI the e2e job builds explicitly.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4321/dexforge/',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'pnpm preview',
    url: 'http://localhost:4321/dexforge/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
