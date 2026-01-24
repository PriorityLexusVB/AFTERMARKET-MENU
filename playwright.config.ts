import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for E2E testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  // Defaulting to Playwright's max worker count can be unstable on some Windows setups.
  // Keep CI deterministic (1 worker) and cap local runs to a small number.
  workers: process.env["CI"] ? 1 : 2,
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run e2e:web",
    url: "http://localhost:4173",
    // Accurate-by-default: always start from a fresh build.
    // If you want faster local iteration, set `PW_REUSE_SERVER=1`.
    reuseExistingServer: !!process.env["CI"] ? false : process.env["PW_REUSE_SERVER"] === "1",
    timeout: 120000,
  },
});
