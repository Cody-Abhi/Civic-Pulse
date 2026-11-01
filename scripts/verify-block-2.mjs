import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = "C:/Users/abhis/.gemini/antigravity/brain/1dd2b301-1dfe-4640-bd46-20c5523887a8/screenshots/block-2";

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function verifyPage(browser, pathUrl, name) {
  for (const width of [360, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: 800 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    console.log(`Checking ${pathUrl} at ${width}px...`);
    const resp = await page.goto(`${BASE_URL}${pathUrl}`, { waitUntil: "networkidle" });
    console.log(`  -> status: ${resp?.status()}`);

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    if (hasHorizontalOverflow) {
      console.error(`  ⚠️ HORIZONTAL OVERFLOW DETECTED at ${width}px on ${pathUrl}`);
    } else {
      console.log(`  ✓ No horizontal scroll at ${width}px`);
    }

    const shotPath = path.join(SCREENSHOT_DIR, `${name}_${width}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`  Saved screenshot: ${shotPath}`);

    // Accessibility check
    try {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const violations = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      console.log(`  Axe critical/serious violations: ${violations.length}`);
      if (violations.length > 0) {
        violations.forEach((v) => console.log(`    - [${v.impact}] ${v.help} (${v.id})`));
      }
    } catch (e) {
      console.log(`  Axe scan note: ${e.message}`);
    }

    await context.close();
  }
}

async function run() {
  const browser = await chromium.launch();
  try {
    console.log("=== Testing Block 2 Data Layer Pages ===");
    await verifyPage(browser, "/", "landing_page");
    await verifyPage(browser, "/explore", "explore_list");
    await verifyPage(browser, "/explore/map", "explore_map");
    await verifyPage(browser, "/complaints/CP-BLR-2611-000001", "public_complaint");

    console.log("\n=== Testing API endpoints ===");
    const metricsRes = await fetch(`${BASE_URL}/api/metrics`);
    const metricsData = await metricsRes.json();
    console.log(`GET /api/metrics: ${metricsRes.status}, total complaints: ${metricsData.metrics?.totalComplaints}`);

    console.log("✅ Block 2 verification completed!");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

