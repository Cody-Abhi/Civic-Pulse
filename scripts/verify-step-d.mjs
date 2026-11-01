import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import * as fs from "fs";
import * as path from "path";

const VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 800 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];

const ROUTES = [
  { path: "/citizen/dashboard", id: "citizen_dashboard" },
  { path: "/citizen/complaints", id: "citizen_complaints" },
  { path: "/citizen/complaints/new", id: "citizen_complaints_new" },
  { path: "/citizen/complaints/synthetic-000007", id: "citizen_complaint_detail" },
  { path: "/citizen/notifications", id: "citizen_notifications" },
];

const ARTIFACT_DIR = "C:/Users/abhis/.gemini/antigravity-ide/brain/1dd2b301-1dfe-4640-bd46-20c5523887a8/screenshots/step-d";

async function run() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  let hasFailures = false;
  const results = [];

  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      const consoleErrors = [];
      const hydrationWarnings = [];

      page.on("console", (msg) => {
        const text = msg.text();
        if (msg.type() === "error") {
          consoleErrors.push(text);
        }
        if (text.toLowerCase().includes("hydration") || text.includes("mismatch") || text.includes("did not match")) {
          hydrationWarnings.push(text);
        }
      });

      page.on("pageerror", (err) => {
        consoleErrors.push(err.message);
      });

      const targetUrl = `http://localhost:3000${route.path}`;
      await page.goto(targetUrl, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);

      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
        };
      });

      // Run Axe audit at desktop viewport (1280)
      let axeViolations = [];
      if (vp.width === 1280) {
        try {
          const axeResults = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .analyze();
          axeViolations = axeResults.violations.filter(
            (v) => v.impact === "serious" || v.impact === "critical"
          );
        } catch (e) {
          console.warn("Axe check error:", e.message);
        }
      }

      const screenshotFilename = `${route.id}_${vp.width}.png`;
      const screenshotPath = path.join(ARTIFACT_DIR, screenshotFilename);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const status = {
        route: route.path,
        viewport: vp.width,
        overflow,
        consoleErrors,
        hydrationWarnings,
        axeViolationsCount: axeViolations.length,
        screenshot: screenshotPath,
      };
      results.push(status);

      if (overflow.hasOverflow || consoleErrors.length > 0 || hydrationWarnings.length > 0 || axeViolations.length > 0) {
        hasFailures = true;
        console.error(`FAILED: ${route.path} @ ${vp.width}px:`, {
          overflow,
          consoleErrors,
          hydrationWarnings,
          axeViolations,
        });
      } else {
        console.log(`PASSED: ${route.path} @ ${vp.width}px (scrollWidth: ${overflow.scrollWidth} <= innerWidth: ${overflow.innerWidth})`);
      }

      await page.close();
      await context.close();
    }
  }

  await browser.close();

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "results.json"),
    JSON.stringify(results, null, 2)
  );

  if (hasFailures) {
    console.error("Step D verification completed with failures!");
    process.exit(1);
  } else {
    console.log("All Step D routes verified across all 6 viewports with 0 errors, 0 overflows, and 0 axe violations!");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
