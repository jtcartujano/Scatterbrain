import { defineConfig, devices } from '@playwright/test';

/** Vite's default. `webServer` below both starts it and waits on it. */
const PORT = 5173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'html' : 'list',

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        /**
         * Drive the Chrome already installed on the machine rather than
         * downloading Playwright's own Chromium build. Nothing to install, no
         * ~100MB in the cache, and it's the browser the app is actually
         * developed against.
         *
         * CI has no system Chrome, so there it falls back to the bundled
         * Chromium — which needs `npx playwright install --with-deps chromium`
         * as a step before the run.
         */
        channel: process.env.CI ? undefined : 'chrome',
      },
    },
  ],

  /**
   * Playwright owns the dev server's lifecycle so a run is one command. Locally
   * it adopts a server you already have up rather than fighting it for the port;
   * in CI there is never one to adopt, and silently reusing a stale server would
   * be worse than failing.
   */
  webServer: {
    command: 'npm run dev',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
