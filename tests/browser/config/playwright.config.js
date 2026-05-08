import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: Boolean(process.env.CI),
  /* Run tests in files in parallel */
  fullyParallel: true,
  outputDir: '/tmp/test-results',
  preserveOutput: 'never',

  /* Configure projects for major browsers */
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

    /* Dist bundle tests — chromium only, one project per bundle */
    {
      name: 'dist:kensington.js',
      testMatch: ['**/browser.spec.js', '**/signals.spec.js'],
      use: { ...devices['Desktop Chrome'], bundle: '/dist/kensington.js' },
    },
    {
      name: 'dist:kensington.min.js',
      testMatch: ['**/browser.spec.js', '**/signals.spec.js'],
      use: { ...devices['Desktop Chrome'], bundle: '/dist/kensington.min.js' },
    },
    {
      name: 'dist:kensington.slim.js',
      testMatch: ['**/browser.spec.js', '**/signals.spec.js'],
      use: { ...devices['Desktop Chrome'], bundle: '/dist/kensington.slim.js' },
    },
    {
      name: 'dist:kensington.slim.min.js',
      testMatch: ['**/browser.spec.js', '**/signals.spec.js'],
      use: { ...devices['Desktop Chrome'], bundle: '/dist/kensington.slim.min.js' },
    },
  ],
  reporter: 'list',
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  testDir: '../',
  timeout: 8000,
  use: {
    trace: 'on-first-retry',
  },

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'node ../server/html-server.js',
    reuseExistingServer: !process.env.CI,
    url: 'http://localhost:3000',
  },
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
});
