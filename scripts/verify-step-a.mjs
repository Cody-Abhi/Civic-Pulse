import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const VIEWPORTS = [
  { width: 360, height: 740, name: "360px" },
  { width: 390, height: 844, name: "390px" },
  { width: 768, height: 1024, name: "768px" },
  { width: 1024, height: 800, name: "1024px" },
  { width: 1280, height: 800, name: "1280px" },
  { width: 1440, height: 900, name: "1440px" },
];

const ROUTES = [
  { path: "/", id: "landing" },
  { path: "/login", id: "login" },
  { path: "/citizen/dashboard", id: "citizen_dashboard" },
];

const ARTIFACT_SCREENSHOT_DIR = "C:/Users/abhis/.gemini/antigravity-ide/brain/1dd2b301-1dfe-4640-bd46-20c5523887a8/screenshots/step-a";

async function run() {
  if (!fs.existsSync(ARTIFACT_SCREENSHOT_DIR)) {
    fs.mkdirSync(ARTIFACT_SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  let hasFailures = false;
  const results = [];

  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
      });

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
      await page.waitForTimeout(500);

      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
        };
      });

      const screenshotFilename = `${route.id}_${vp.width}.png`;
      const screenshotPath = path.join(ARTIFACT_SCREENSHOT_DIR, screenshotFilename);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const status = {
        route: route.path,
        viewport: vp.width,
        overflow,
        consoleErrors,
        hydrationWarnings,
        screenshot: screenshotPath,
      };
      results.push(status);

      if (overflow.hasOverflow || consoleErrors.length > 0 || hydrationWarnings.length > 0) {
        hasFailures = true;
        console.error(`FAILED: ${route.path} @ ${vp.width}px:`, {
          overflow,
          consoleErrors,
          hydrationWarnings,
        });
      } else {
        console.log(`PASSED: ${route.path} @ ${vp.width}px (scrollWidth: ${overflow.scrollWidth} <= innerWidth: ${overflow.innerWidth})`);
      }

      await page.close();
    }
  }

  await browser.close();

  fs.writeFileSync(
    path.join(ARTIFACT_SCREENSHOT_DIR, "results.json"),
    JSON.stringify(results, null, 2)
  );

  if (hasFailures) {
    console.error("Some checks failed!");
    process.exit(1);
  } else {
    console.log("ALL VIEWPORTS AND ROUTES PASSED PERFECTLY!");
  }
}

run().catch((e) => {
  console.error("Runner failed:", e);
  process.exit(1);
});
