import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);

/**
 * Point the suite at a deployment instead of a local dev server:
 *
 *   E2E_BASE_URL=https://… npx playwright test
 *
 * It exists because the suite needs a database and a developer may not have Postgres
 * locally.
 *
 * Set E2E_TOKEN to the value configured on the target, and every row the run creates is
 * flagged `isSeed`: excluded from admin stats and never delivered to GoHighLevel. Without
 * it the suite still passes, but its rows are indistinguishable from real ones — so
 * treat a missing token as a mistake, not an option.
 */
const REMOTE = process.env.E2E_BASE_URL;
const baseURL = REMOTE ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: REMOTE ? 120_000 : 90_000,
  expect: { timeout: REMOTE ? 15_000 : 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: REMOTE ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    ...(process.env.E2E_TOKEN ? { extraHTTPHeaders: { "x-taboo-e2e": process.env.E2E_TOKEN } } : {}),
    ...devices["iPhone 12"],
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  },
  ...(REMOTE
    ? {}
    : {
        webServer: {
          command: `npx next dev -p ${PORT}`,
          url: `http://localhost:${PORT}/api/health`,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      }),
});
