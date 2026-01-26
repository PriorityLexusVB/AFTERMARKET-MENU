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
    ...(process.env["PW_WEBKIT"] === "1"
      ? [
          {
            name: "webkit-ipad",
            use: {
              ...devices["iPad Pro 11"],
              browserName: "webkit" as const,
            },
          },
        ]
      : []),
  ],

  webServer: {
    command: process.env["CI"]
      ? "npm run e2e:web"
      : process.env["PW_REUSE_SERVER"] === "1"
        ? "npm run e2e:dev"
        : "npm run e2e:web",
    url: "http://localhost:4173",
    // CI should be strict and deterministic: always start a fresh web server.
    // Locally, reuse an existing server on the port by default to avoid flaky
    // "port already in use" failures when a dev/preview server is already running.
    // Set `PW_REUSE_SERVER=0` to force starting a fresh server locally.
    reuseExistingServer: process.env["CI"] ? false : process.env["PW_REUSE_SERVER"] !== "0",
    timeout: 120000,
  },
});
