import { defineConfig, devices } from '@playwright/test';

/** Runs against the production build (`pnpm build` first) on its own port, so it never reuses `pnpm dev`. */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4329',
    trace: 'on-first-retry',
  },
  // Chrome on desktop and phone, plus the Firefox and Safari (WebKit) engines.
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm preview --port 4329',
    url: 'http://localhost:4329',
    reuseExistingServer: !process.env.CI,
  },
});
