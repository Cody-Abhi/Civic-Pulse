import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

async function verifyResponsiveAndCapture() {
  const screenshotsDir = path.resolve(process.cwd(), "docs/screenshots/block_a");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const results = {
    pages: [],
    health: null,
    overflowIssues: [],
    consoleErrors: [],
  };

  const browser = await chromium.launch({ headless: true });

  const targets = [
    { name: "landing", path: "/", selector: "main, body" },
    { name: "login", path: "/login", selector: "text=Quick Sign In · Demo Accounts" },
  ];

  const viewports = [
    { name: "360px", width: 360, height: 780 },
    { name: "1280px", width: 1280, height: 800 },
  ];

  for (const target of targets) {
    for (const vp of viewports) {
      const pageName = `${target.name}-${vp.name}`;
      console.log(`\n--- Testing ${pageName} (${vp.width}x${vp.height}) at http://localhost:3000${target.path} ---`);

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      const pageErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          console.error(`[Console Error] ${msg.text()}`);
          pageErrors.push(msg.text());
        }
      });
      page.on("pageerror", (err) => {
        console.error(`[Page Error] ${err.message}`);
        pageErrors.push(err.message);
      });

      const response = await page.goto(`http://localhost:3000${target.path}`, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      const status = response ? response.status() : null;
      console.log(`Status: ${status}`);

      if (target.selector) {
        console.log(`Waiting for selector: ${target.selector}`);
        await page.waitForSelector(target.selector, { timeout: 10000 });
      }

      // If login page, verify demo credentials cards loaded from API
      if (target.name === "login") {
        await page.waitForSelector("text=Citizen Demo", { timeout: 10000 });
        await page.waitForSelector("text=Roads Authority Demo", { timeout: 10000 });
        const citizenVisible = await page.isVisible("text=Citizen Demo");
        const roadsVisible = await page.isVisible("text=Roads Authority Demo");
        console.log(`Demo accounts visible: Citizen=${citizenVisible}, Roads=${roadsVisible}`);
      }

      // Check for horizontal overflow (document.documentElement.scrollWidth > window.innerWidth)
      const overflowMetrics = await page.evaluate(() => {
        const docElem = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(docElem.scrollWidth, body.scrollWidth);
        const clientWidth = docElem.clientWidth;
        const windowWidth = window.innerWidth;

        // Find elements wider than viewport
        const overflowingElements = [];
        const allElements = document.querySelectorAll("*");
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.right > windowWidth + 2 || rect.left < -2) {
            // Check computed overflow style
            const style = window.getComputedStyle(el);
            if (style.overflow !== "hidden" && style.position !== "fixed") {
              overflowingElements.push({
                tag: el.tagName,
                className: el.className ? String(el.className).slice(0, 80) : "",
                right: rect.right,
                width: rect.width,
              });
            }
          }
        }

        return {
          scrollWidth,
          clientWidth,
          windowWidth,
          hasHorizontalScrollbar: scrollWidth > clientWidth,
          overflowingElementsCount: overflowingElements.length,
          topOverflowElements: overflowingElements.slice(0, 5),
        };
      });

      console.log(`Dimensions: window=${overflowMetrics.windowWidth}px, docClient=${overflowMetrics.clientWidth}px, docScroll=${overflowMetrics.scrollWidth}px`);
      console.log(`Horizontal overflow detected: ${overflowMetrics.hasHorizontalScrollbar}`);

      const screenshotFilename = `${target.name}-${vp.name}.png`;
      const screenshotPath = path.join(screenshotsDir, screenshotFilename);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot saved to: ${screenshotPath}`);

      const fileStats = fs.statSync(screenshotPath);
      console.log(`Screenshot file size: ${fileStats.size} bytes`);

      results.pages.push({
        target: target.name,
        viewport: vp.name,
        width: vp.width,
        status,
        screenshotFilename,
        fileSizeBytes: fileStats.size,
        overflowMetrics,
        errors: pageErrors,
      });

      if (overflowMetrics.hasHorizontalScrollbar) {
        results.overflowIssues.push({
          target: target.name,
          viewport: vp.name,
          details: overflowMetrics,
        });
      }

      if (pageErrors.length > 0) {
        results.consoleErrors.push({
          target: target.name,
          viewport: vp.name,
          errors: pageErrors,
        });
      }

      await context.close();
    }
  }

  // Check /api/health endpoint
  console.log("\n--- Checking /api/health ---");
  const healthRes = await fetch("http://localhost:3000/api/health");
  const healthStatus = healthRes.status;
  const healthHeaders = Object.fromEntries(healthRes.headers.entries());
  const healthJson = await healthRes.json();

  console.log(`Health Status: ${healthStatus}`);
  console.log(`Health Response: ${JSON.stringify(healthJson, null, 2)}`);

  results.health = {
    status: healthStatus,
    headers: healthHeaders,
    body: healthJson,
  };

  await browser.close();

  // Write summary json for analysis
  fs.writeFileSync(
    path.join(screenshotsDir, "verification-summary.json"),
    JSON.stringify(results, null, 2)
  );

  console.log("\nVerification complete!");
  return results;
}

verifyResponsiveAndCapture().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
