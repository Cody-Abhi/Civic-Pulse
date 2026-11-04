import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? process.env.E2E_BASE_URL ?? "http://localhost:3000";

// Dynamically leverage Next.js production build (.next/BUILD_ID) if available
const hasProdBuild = fs.existsSync(path.resolve(process.cwd(), ".next/BUILD_ID"));
const defaultServerCmd = hasProdBuild ? "pnpm start" : "pnpm dev";
const webServerCommand = process.env.PLAYWRIGHT_SERVER_CMD ?? defaultServerCmd;

/**
 * E2E + responsive + a11y (§39.4–39.5). Verified viewports from §15.4:
 * 360, 375, 390, 768, 1024, 1280, 1440. Suites are authored in T-19.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  // Base test timeout: 60s locally, 90s in CI to accommodate cold route compilation + dual Axe a11y scans
  timeout: process.env.CI ? 90_000 : 60_000,
  expect: {
    // Assertion timeout: 10s gives margin for React 19 client hydration under load
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "mobile-360", use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 780 } } },
    { name: "mobile-375", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 } } },
    { name: "mobile-390", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } } },
    { name: "tablet-768", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
    { name: "laptop-1024", use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 768 } } },
    { name: "desktop-1280", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "wide-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          command: webServerCommand,
          url: BASE_URL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
});
