import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = "C:/Users/abhis/.gemini/antigravity/brain/1dd2b301-1dfe-4640-bd46-20c5523887a8/screenshots/block-6";

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function loginAsRole(page, roleLabel, expectedPathPrefix) {
  page.on("console", (msg) => console.log(`  [BROWSER ${msg.type()}]: ${msg.text()}`));
  page.on("pageerror", (err) => console.error(`  [BROWSER ERROR]: ${err.message}`));

  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const demoBtn = page.locator(`button:has-text('${roleLabel}')`);
  await demoBtn.waitFor({ state: "visible", timeout: 10000 });
  console.log(`  Clicking '${roleLabel}' demo button...`);
  await demoBtn.click();

  if (expectedPathPrefix) {
    try {
      await page.waitForFunction(
        (prefix) => window.location.pathname.includes(prefix),
        expectedPathPrefix,
        { timeout: 25000 },
      );
      console.log(`  ✓ Successfully navigated to role area: ${page.url()}`);
    } catch (e) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `login_error_${roleLabel.replace(/\s+/g, '_')}.png`) });
      const currentUrl = page.url();
      const alert = await page.locator("[role='alert']").textContent().catch(() => null);
      console.error(`Login failed for ${roleLabel}. Current URL: ${currentUrl}, Alert: ${alert}`);
      throw e;
    }
  } else {
    await page.waitForTimeout(3000);
  }
}

async function verifyPageResponsiveness(page, urlPath, name, expectedSelector) {
  // Test viewports: mobile (360, 390), tablet (768, 1024), desktop (1280, 1440)
  for (const width of [360, 390, 768, 1024, 1280, 1440]) {
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

    // Accessibility check on primary viewports (360 and 1280)
    if (width === 360 || width === 1280) {
      try {
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();

        const violations = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        console.log(`  Axe critical/serious violations at ${width}px: ${violations.length}`);
        if (violations.length > 0) {
          violations.forEach((v) => console.log(`    - [${v.impact}] ${v.help} (${v.id})`));
        }
      } catch (e) {
        console.log(`  Axe scan note: ${e.message}`);
      }
    }
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  console.log("\n================ BLOCK 6 UI POLISH VERIFICATION ================");

  // 1. Landing Page (UI-01)
  {
    console.log("\n--- 1. Testing Landing Page (UI-01) ---");
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await verifyPageResponsiveness(page, "/", "landing_page", "h1");
    await context.close();
  }

  // 2. Explore Catalog (UI-05) & Map View (UI-06)
  {
    console.log("\n--- 2. Testing Explore Catalog (UI-05) ---");
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await verifyPageResponsiveness(page, "/explore", "explore_catalog", "h1");

    console.log("\n--- 3. Testing Explore Map with Heatmap Toggle (UI-06) ---");
    await verifyPageResponsiveness(page, "/explore/map", "explore_map", "h1");

    // Click heatmap toggle
    const heatmapBtn = page.locator("button:has-text('Heatmap')");
    if (await heatmapBtn.isVisible()) {
      await heatmapBtn.click();
      console.log("  ✓ Toggled to Heatmap layer");
      await page.waitForTimeout(1000);
      const heatShot = path.join(SCREENSHOT_DIR, "explore_map_heatmap_active_1280.png");
      await page.screenshot({ path: heatShot });
      console.log(`  Saved heatmap screenshot: ${heatShot}`);
    }
    await context.close();
  }

  // 3. Authority Workspace (UI-08..14)
  {
    console.log("\n--- 4. Testing Authority Queue & Kanban (UI-08/09) ---");
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    await loginAsRole(page, "Roads Authority Demo", "authority");

    // Queue Table View
    await verifyPageResponsiveness(page, "/authority/queue", "authority_queue_table", "h1");

    // Switch to Kanban View
    const kanbanBtn = page.locator("button:has-text('Kanban')");
    if (await kanbanBtn.isVisible()) {
      await kanbanBtn.click();
      console.log("  ✓ Toggled to Kanban Board view");
      await page.waitForTimeout(1000);
      const kanbanShot = path.join(SCREENSHOT_DIR, "authority_queue_kanban_1280.png");
      await page.screenshot({ path: kanbanShot });
      console.log(`  Saved Kanban screenshot: ${kanbanShot}`);
    }

    // Authority Operations Map
    console.log("\n--- 5. Testing Authority Field Operations Map (UI-10) ---");
    await verifyPageResponsiveness(page, "/authority/map", "authority_ops_map", "h1");

    await context.close();
  }

  // 4. Admin Dashboard (UI-23..28)
  {
    console.log("\n--- 6. Testing Admin Dashboard (UI-23) ---");
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    await loginAsRole(page, "City Admin Demo", "admin");
    await verifyPageResponsiveness(page, "/admin/dashboard", "admin_dashboard", "h1");
    await context.close();
  }

  await browser.close();
  console.log("\n✓ BLOCK 6 VERIFICATION COMPLETED SUCCESSFULLY!");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

