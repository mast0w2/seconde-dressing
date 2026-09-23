// @ts-nocheck
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Locally these tests run against `next dev`, which compiles each route the
  // first time it is asked for. Left to its default (half the cores, times
  // three browsers), Playwright opened enough contexts at once that browser
  // startup itself blew past the timeout, and a dozen tests failed for
  // reasons that had nothing to do with the app. Four is plenty here.
  workers: process.env.CI ? 1 : 4,
  // Same reason: a cold route can legitimately take more than the default 30s
  // to compile and serve on the first hit.
  timeout: 60_000,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
