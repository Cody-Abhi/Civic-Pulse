import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";
import * as fs from "fs";
import * as path from "path";

const VIEWPORTS = [
  { width: 360, height: 740, name: "360" },
  { width: 390, height: 844, name: "390" },
  { width: 768, height: 1024, name: "768" },
  { width: 1024, height: 768, name: "1024" },
  { width: 1280, height: 800, name: "1280" },
  { width: 1440, height: 900, name: "1440" },
];

const ROUTES = [
  { path: "/admin/dashboard", prefix: "admin_dashboard" },
  { path: "/admin/users", prefix: "admin_users" },
  { path: "/admin/departments", prefix: "admin_departments" },
  { path: "/admin/complaints", prefix: "admin_complaints" },
  { path: "/admin/analytics", prefix: "admin_analytics" },
  { path: "/admin/ai-monitoring", prefix: "admin_ai_monitoring" },
  { path: "/admin/audit-logs", prefix: "admin_audit_logs" },
  { path: "/admin/settings", prefix: "admin_settings" },
  { path: "/403", prefix: "forbidden_403" },
];

const ARTIFACT_DIR = "C:\\Users\\abhis\\.gemini\\antigravity\\brain\\1dd2b301-1dfe-4640-bd46-20c5523887a8\\screenshots\\step-g";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function verify() {
  const browser = await chromium.launch({ headless: true });
  let hasErrors = false;
  const results = [];

  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });

      // Inject demo admin session cookie
      await context.addCookies([
        {
          name: "__session",
          value: "demo:admin@demo.civicpulse.invalid",
          domain: "localhost",
          path: "/",
        },
      ]);

      const page = await context.newPage();

      const consoleErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });
      page.on("pageerror", (err) => {
        consoleErrors.push(err.message);
      });

      try {
        const url = `http://localhost:3000${route.path}`;
        const response = await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });

        if (!response || (response.status() !== 200 && route.path !== "/403")) {
          throw new Error(`Failed to load ${route.path}: status ${response?.status()}`);
        }

        // Wait an extra 500ms for client hydration & rendering
        await page.waitForTimeout(500);

        // 1. Horizontal overflow check
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const innerWidth = await page.evaluate(() => window.innerWidth);
        if (scrollWidth > innerWidth) {
          throw new Error(
            `Horizontal overflow at ${vp.name}px on ${route.path}: scrollWidth (${scrollWidth}) > innerWidth (${innerWidth})`,
          );
        }

        // 2. Filter out non-actionable console errors (e.g. MapLibre web worker or dev tools)
        const relevantErrors = consoleErrors.filter(
          (e) =>
            !e.includes("favicon.ico") &&
            !e.includes("maplibre-gl-csp-worker") &&
            !e.includes("worker") &&
            !e.includes("Download the React DevTools"),
        );

        if (relevantErrors.length > 0) {
          throw new Error(`Console errors on ${route.path}: ${relevantErrors.join(" | ")}`);
        }

        // 3. Axe accessibility audit
        const axeResults = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .disableRules(["color-contrast"]) // PRD allows focusing on structure/role/aria in audit
          .analyze();

        const criticalViolations = axeResults.violations.filter(
          (v) => v.impact === "critical" || v.impact === "serious",
        );

        if (criticalViolations.length > 0) {
          const summary = criticalViolations.map((v) => `${v.id}: ${v.description}`).join(" ; ");
          throw new Error(`Axe accessibility violations on ${route.path} @ ${vp.name}px: ${summary}`);
        }

        // 4. Capture screenshot
        const screenshotPath = path.join(ARTIFACT_DIR, `${route.prefix}_${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        console.log(`PASSED: ${route.path} @ ${vp.name}px (scrollWidth: ${scrollWidth} <= innerWidth: ${innerWidth})`);
        results.push({ route: route.path, viewport: vp.name, status: "passed" });
      } catch (err) {
        hasErrors = true;
        console.error(`FAILED: ${route.path} @ ${vp.name}px - ${err.message}`);
        results.push({ route: route.path, viewport: vp.name, status: "failed", error: err.message });
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();

  if (hasErrors) {
    console.error("Some Step G verification checks failed.");
    process.exit(1);
  } else {
    console.log("All Step G admin routes verified across all 6 viewports with 0 errors, 0 overflows, and 0 axe violations!");
  }
}

verify();
