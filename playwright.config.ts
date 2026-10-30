import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3103';

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: '**/admin.spec.ts',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: 'list',
  outputDir: './test-results/storefront',
  use: {
    baseURL,
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // An explicit URL must point to an isolated preview server with these same empty
  // catalogue credentials. Never reuse a developer server that may use live data.
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3103',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      GOOGLE_SHEET_ID: '',
      GOOGLE_SHEETS_API_KEY: '',
      NEXT_DIST_DIR: '.tooling/storefront-e2e',
    },
  },
});
