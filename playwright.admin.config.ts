import { defineConfig } from '@playwright/test';
import { adminTestEnv } from './tests/helpers/admin-env';
export default defineConfig({
  testDir: './tests/e2e', testMatch: 'admin.spec.ts', workers: 1, retries: 0, reporter: 'list',
  outputDir: './test-results/admin',
  use: { baseURL: adminTestEnv.SITE_URL, browserName: 'chromium', viewport: { width: 390, height: 844 }, trace: 'retain-on-failure' },
  webServer: [
    { command: 'npm run dev -- --hostname 127.0.0.1 --port 3104', url: 'http://127.0.0.1:3104', timeout: 120000, reuseExistingServer: false, env: { ...adminTestEnv, NEXT_DIST_DIR: '.tooling/admin-e2e' } },
    { command: 'npm run dev -- --hostname 127.0.0.1 --port 3105', url: 'http://127.0.0.1:3105', timeout: 120000, reuseExistingServer: false, env: { ...adminTestEnv, SITE_URL: 'http://127.0.0.1:3105', ADMIN_EMAILS: '', NEXT_DIST_DIR: '.tooling/admin-setup-e2e' } },
  ],
});
