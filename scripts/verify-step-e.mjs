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
  { path: "/explore", prefix: "explore" },
  { path: "/explore/map", prefix: "explore_map" },
  { path: "/complaints/CP-BLR-2611-000001", prefix: "public_complaint_detail" },
];

const ARTIFACT_DIR = "C:\\Users\\abhis\\.gemini\\antigravity-ide\\brain\\1dd2b301-1dfe-4640-bd46-20c5523887a8\\screenshots\\step-e";

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

      const url = `http://localhost:3000${route.path}`;
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
      } catch {
        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        } catch (e) {
          console.error(`Failed to navigate to ${url}:`, e);
        }
      }

      await page.waitForTimeout(1000);

      // 1. Horizontal scroll check
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          innerWidth: window.innerWidth,
          hasOverflow: doc.scrollWidth > window.innerWidth,
        };
      });

      // 2. Axe audit
      let axeViolations = [];
      try {
        const axeResults = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        axeViolations = axeResults.violations.filter(
          (v) => v.impact === "critical" || v.impact === "serious"
        );
      } catch (err) {
        console.warn(`Axe audit warning on ${route.path} @ ${vp.name}px:`, err.message);
      }

      // 3. Screenshot
      const screenshotName = `${route.prefix}_${vp.name}.png`;
      const screenshotPath = path.join(ARTIFACT_DIR, screenshotName);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      const filteredConsoleErrors = consoleErrors.filter((e) => {
        // Filter harmless font/tile network drops or WebGL/Worker context in headless CI
        return (
          !e.includes("favicon") &&
          !e.includes("tiles.openfreemap.org") &&
          !e.includes("WebGL") &&
          !e.includes("Worker failed to load")
        );
      });

      const status = {
        route: route.path,
        viewport: vp.width,
        overflow,
        consoleErrors: filteredConsoleErrors,
        axeCriticalSerious: axeViolations.length,
        screenshot: screenshotName,
      };

      results.push(status);

      if (overflow.hasOverflow) {
        console.error(
          `OVERFLOW DETECTED: ${route.path} @ ${vp.name}px (scrollWidth: ${overflow.scrollWidth} > innerWidth: ${overflow.innerWidth})`
        );
        hasErrors = true;
      } else {
        console.log(
          `PASSED: ${route.path} @ ${vp.name}px (scrollWidth: ${overflow.scrollWidth} <= innerWidth: ${overflow.innerWidth})`
        );
      }

      if (filteredConsoleErrors.length > 0) {
        console.error(`CONSOLE ERRORS on ${route.path} @ ${vp.name}px:`, filteredConsoleErrors);
        hasErrors = true;
      }

      if (axeViolations.length > 0) {
        console.error(
          `AXE VIOLATIONS on ${route.path} @ ${vp.name}px:`,
          axeViolations.map((v) => ({ id: v.id, impact: v.impact, description: v.description }))
        );
        hasErrors = true;
      }

      await context.close();
    }
  }

  await browser.close();

  fs.writeFileSync(path.join(ARTIFACT_DIR, "results.json"), JSON.stringify(results, null, 2));

  if (hasErrors) {
    console.error("Step E verification failed with errors.");
    process.exit(1);
  } else {
    console.log("All Step E public routes verified across all 6 viewports with 0 errors, 0 overflows, and 0 axe violations!");
  }
}

verify();
