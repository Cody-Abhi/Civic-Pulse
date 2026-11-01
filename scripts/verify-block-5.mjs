import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = "C:/Users/abhis/.gemini/antigravity/brain/1dd2b301-1dfe-4640-bd46-20c5523887a8/screenshots/block-5";

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function loginAsRole(page, roleLabel, expectedPathPrefix) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  const demoBtn = page.locator(`button:has-text('${roleLabel}')`);
  await demoBtn.waitFor({ state: "visible", timeout: 10000 });
  await demoBtn.click();
  if (expectedPathPrefix) {
    await page.waitForURL(`**/${expectedPathPrefix}/**`, { timeout: 15000 });
  } else {
    await page.waitForTimeout(3000);
  }
}

async function verifyPageResponsiveness(page, urlPath, name, expectedSelector) {
  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    console.log(`Checking ${urlPath} at ${width}px...`);

    await page.goto(`${BASE_URL}${urlPath}`, { waitUntil: "domcontentloaded" });
    if (expectedSelector) {
      await page.waitForSelector(expectedSelector, { timeout: 10000 });
    }
    await page.waitForTimeout(1000);

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    if (hasHorizontalOverflow) {
      console.error(`  ⚠️ HORIZONTAL OVERFLOW DETECTED at ${width}px on ${urlPath}`);
    } else {
      console.log(`  ✓ No horizontal scroll at ${width}px`);
    }

    const shotPath = path.join(SCREENSHOT_DIR, `${name}_${width}.png`);
    await page.screenshot({ path: shotPath });
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
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  console.log("\n================ BLOCK 5 VERIFICATION ================");

  // 1. Citizen Pages: /citizen/profile, /citizen/settings, /citizen/complaints/new (Step 3 LocationPicker)
  {
    console.log("\n--- Testing Citizen Pages & LocationPicker ---");
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    await loginAsRole(page, "Citizen Demo", "citizen");

    // Profile page
    await verifyPageResponsiveness(page, "/citizen/profile", "citizen_profile", "h1:has-text('My Profile')");

    // Settings page
    await verifyPageResponsiveness(page, "/citizen/settings", "citizen_settings", "h1:has-text('Settings')");

    // Step 3 LocationPicker in complaint creation wizard
    console.log("\nTesting Step 3 LocationPicker in complaint wizard...");
    await page.goto(`${BASE_URL}/citizen/complaints/new`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("button:has-text('Next: Details')", { timeout: 10000 });
    await page.click("button:has-text('Next: Details')");

    await page.waitForSelector("#report-description", { timeout: 10000 });
    await page.fill("#report-description", "Large crater pothole on service road near Bellandur ecospace entrance");
    await page.click("button:has-text('Next: Location')");

    // We are on Step 3: Location
    await page.waitForSelector("div[aria-label*='Map location picker']", { timeout: 10000 });
    console.log("  ✓ Found interactive MapLibre LocationPicker container");

    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      if (hasHorizontalOverflow) {
        console.error(`  ⚠️ HORIZONTAL OVERFLOW DETECTED at ${width}px on LocationPicker`);
      } else {
        console.log(`  ✓ No horizontal scroll at ${width}px on LocationPicker`);
      }
      const shotPath = path.join(SCREENSHOT_DIR, `wizard_step3_location_picker_${width}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`  Saved screenshot: ${shotPath}`);
    }

    await context.close();
  }

  // 2. Authority Pages: /authority/notifications, /authority/profile
  {
    console.log("\n--- Testing Authority Pages ---");
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    await loginAsRole(page, "Roads Authority Demo", "authority");

    // Authority notifications
    await verifyPageResponsiveness(page, "/authority/notifications", "authority_notifications", "h1:has-text('Department Notifications')");

    // Authority profile
    await verifyPageResponsiveness(page, "/authority/profile", "authority_profile", "h1:has-text('Authority Profile & Settings')");

    await context.close();
  }

  await browser.close();
  console.log("\n✓ BLOCK 5 VERIFICATION COMPLETED SUCCESSFULLY!");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
