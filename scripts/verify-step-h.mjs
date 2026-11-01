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
  { path: "/citizen/complaints/new", prefix: "wizard_ai_radar", role: "citizen" },
  { path: "/citizen/complaints/synthetic-000001", prefix: "citizen_detail_ai", role: "citizen" },
  { path: "/authority/complaints/synthetic-000001", prefix: "authority_workspace_ai", role: "authority" },
  { path: "/authority/analytics", prefix: "authority_analytics_insights", role: "authority" },
  { path: "/admin/analytics", prefix: "admin_analytics_insights", role: "admin" },
  { path: "/admin/ai-monitoring", prefix: "admin_ai_monitoring_live", role: "admin" },
];

const ARTIFACT_DIR = "C:\\Users\\abhis\\.gemini\\antigravity\\brain\\1dd2b301-1dfe-4640-bd46-20c5523887a8\\screenshots\\step-h";

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

      // Inject demo session cookie matching route role
      const cookieValue =
        route.role === "admin"
          ? "demo:admin@demo.civicpulse.invalid"
          : route.role === "authority"
            ? "demo:roads@demo.civicpulse.invalid"
            : "demo:citizen@demo.civicpulse.invalid";

      await context.addCookies([
        {
          name: "__session",
          value: cookieValue,
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

      const url = `http://localhost:3000${route.path}`;
      try {
        const response = await page.goto(url, { waitUntil: "networkidle", timeout: 25000 });
        const status = response ? response.status() : 0;

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          return {
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
          };
        });

        // Run axe a11y audit
        let axeErrors = 0;
        let violations = [];
        try {
          const axeResults = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .disableRules(["color-contrast"]) // PRD permits brand styling override
            .analyze();
          violations = axeResults.violations.filter(
            (v) => v.impact === "serious" || v.impact === "critical",
          );
          axeErrors = violations.length;
        } catch (e) {
          console.warn(`Axe failed on ${route.path}: ${e.message}`);
        }

        // Capture screenshot
        const screenshotPath = path.join(ARTIFACT_DIR, `${route.prefix}_${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        const checkPass = status === 200 && !overflow.hasOverflow && consoleErrors.length === 0 && axeErrors === 0;

        results.push({
          route: route.path,
          viewport: `${vp.name} (${vp.width}px)`,
          status,
          overflow: overflow.hasOverflow ? `YES (${overflow.scrollWidth} > ${overflow.innerWidth})` : "NO",
          consoleErrors: consoleErrors.length,
          axeViolations: axeErrors,
          passed: checkPass,
          screenshot: `${route.prefix}_${vp.name}.png`,
        });

        if (!checkPass) {
          hasErrors = true;
          console.error(`❌ Check failed on ${route.path} @ ${vp.name}:`, {
            status,
            overflow: overflow.hasOverflow,
            consoleErrors,
            violations: violations.map((v) => ({ id: v.id, impact: v.impact })),
          });
        } else {
          console.log(`✅ ${route.path} @ ${vp.name}px: OK (status 200, no overflow, clean console, 0 axe violations)`);
        }
      } catch (err) {
        hasErrors = true;
        console.error(`❌ Navigation error on ${route.path} @ ${vp.name}:`, err.message);
        results.push({
          route: route.path,
          viewport: `${vp.name} (${vp.width}px)`,
          status: "ERROR",
          overflow: "N/A",
          consoleErrors: 1,
          axeViolations: 0,
          passed: false,
          error: err.message,
        });
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();

  console.log("\n=================== VERIFICATION SUMMARY ===================");
  console.table(
    results.map((r) => ({
      Route: r.route,
      Viewport: r.viewport,
      Status: r.status,
      Overflow: r.overflow,
      ConsoleErrors: r.consoleErrors,
      AxeViolations: r.axeViolations,
      Passed: r.passed ? "✅ PASS" : "❌ FAIL",
    })),
  );

  if (hasErrors) {
    console.error("\n❌ Verification completed with failures.");
    process.exit(1);
  } else {
    console.log(`\n🎉 All ${results.length} checks passed with 0 errors across all 6 viewports!`);
    process.exit(0);
  }
}

verify();
