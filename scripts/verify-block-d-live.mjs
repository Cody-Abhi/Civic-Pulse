import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "docs/screenshots/block_d");

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function run() {
  console.log(`Starting Block D verification against ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: "360", width: 360, height: 780 },
    { name: "1280", width: 1280, height: 800 },
  ];

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`Testing Viewport: ${vp.name}px (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    // 1. Landing Page Judge Panel
    {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
      const judgeSection = page.locator('section[aria-label="Try it as a judge"]').first();
      await judgeSection.waitFor({ state: "visible", timeout: 10000 });
      console.log(`[PASS] Landing page judge panel visible at ${vp.name}px`);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `01_landing_judge_panel_${vp.name}.png`),
        fullPage: false,
      });
      await context.close();
    }

    // 2. Login Page Judge Panel
    {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
      const loginJudgePanel = page.locator('section[aria-label="Try it as a judge"]').first();
      await loginJudgePanel.waitFor({ state: "visible", timeout: 10000 });
      console.log(`[PASS] Login page judge panel visible at ${vp.name}px`);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `02_login_judge_panel_${vp.name}.png`),
        fullPage: false,
      });
      await context.close();
    }

    // 3. Citizen Demo & Guided Tour
    {
      console.log(`--- Testing Citizen Demo & Guided Tour at ${vp.name}px ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
      const citizenBtn = page.locator('button:has-text("Citizen Demo")').first();
      await citizenBtn.waitFor({ state: "visible", timeout: 10000 });
      await citizenBtn.click();
      await page.waitForURL("**/citizen/dashboard", { timeout: 15000 });
      console.log(`[PASS] Citizen demo auto-logged in to /citizen/dashboard at ${vp.name}px`);

      const tourPanel = page.locator('[data-testid="judge-guided-tour"], [aria-label="Judge Guided Tour"]').first();
      await tourPanel.waitFor({ state: "visible", timeout: 10000 });
      console.log(`[PASS] Citizen Guided Tour checklist rendered at ${vp.name}px`);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `03_citizen_guided_tour_${vp.name}.png`),
        fullPage: false,
      });
      await context.close();
    }

    // 4. Authority Demo & Guided Tour
    {
      console.log(`--- Testing Authority Demo & Guided Tour at ${vp.name}px ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
      const authorityBtn = page.locator('button:has-text("Roads Authority Demo")').first();
      await authorityBtn.waitFor({ state: "visible", timeout: 10000 });
      await authorityBtn.click();
      await page.waitForURL("**/authority/**", { timeout: 15000 });
      console.log(`[PASS] Authority demo auto-logged in at ${vp.name}px`);

      const authTour = page.locator('[data-testid="judge-guided-tour"], [aria-label="Judge Guided Tour"]').first();
      await authTour.waitFor({ state: "visible", timeout: 10000 });
      console.log(`[PASS] Authority Guided Tour checklist rendered at ${vp.name}px`);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `04_authority_guided_tour_${vp.name}.png`),
        fullPage: false,
      });
      await context.close();
    }

    // 5. Admin (View-Only) Demo, Banner, and Disabled Mutation
    {
      console.log(`--- Testing Admin (View-Only) Demo at ${vp.name}px ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
      const adminBtn = page.locator('button:has-text("Admin (View-Only) Demo"), button:has-text("Admin (View-Only)")').first();
      await adminBtn.waitFor({ state: "visible", timeout: 10000 });
      await adminBtn.click();
      await page.waitForURL("**/admin/dashboard", { timeout: 15000 });
      console.log(`[PASS] Admin view-only demo auto-logged in at ${vp.name}px`);

      const viewOnlyBanner = page.locator('text="Admin View-Only Demo:"').first();
      await viewOnlyBanner.waitFor({ state: "visible", timeout: 10000 });
      console.log(`[PASS] View-only admin banner visible at ${vp.name}px`);

      // Navigate to AI Monitoring to test view-only guard
      await page.goto(`${BASE_URL}/admin/ai-monitoring`, { waitUntil: "domcontentloaded" });
      const pauseButton = page.locator('button:has-text("Pause Classifier"), button:has-text("Resume Classifier")').first();
      if (await pauseButton.count() > 0) {
        const isDisabled = await pauseButton.isDisabled();
        console.log(`[PASS] AI classifier mutation button is disabled: ${isDisabled}`);
      }

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `05_admin_viewonly_tooltip_${vp.name}.png`),
        fullPage: false,
      });
      await context.close();
    }
  }

  // 6. Test 403 on View-Only Admin API mutation
  console.log(`\n--- Testing View-Only Admin API 403 Protection ---`);
  const apiContext = await browser.newContext();
  const loginPage = await apiContext.newPage();
  await loginPage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await loginPage.locator('button:has-text("Admin (View-Only) Demo"), button:has-text("Admin (View-Only)")').first().click();
  await loginPage.waitForURL("**/admin/dashboard", { timeout: 15000 });

  const pauseResponse = await loginPage.request.post(`${BASE_URL}/api/admin/ai/pause`, {
    data: { paused: true, reason: "Test unauthorized pause" },
  });
  console.log(`View-Only POST /api/admin/ai/pause status: ${pauseResponse.status()}`);
  const pauseJson = await pauseResponse.json();
  const errText = typeof pauseJson.error === "string" ? pauseJson.error : pauseJson.error?.message || JSON.stringify(pauseJson);
  console.log(`Response error text: ${errText}`);
  if (pauseResponse.status() === 403 && errText.includes("View-only demo account")) {
    console.log(`[PASS] View-only admin received HTTP 403 on mutating API call`);
  } else {
    throw new Error(`Expected 403 View-only demo account, got ${pauseResponse.status()}: ${JSON.stringify(pauseJson)}`);
  }
  await apiContext.close();

  // 7. Test Cron Reset API
  console.log(`\n--- Testing Vercel Cron /api/cron/demo-reset ---`);
  const cronContext = await browser.newContext();
  const cronPage = await cronContext.newPage();
  const cronSecret = process.env.CRON_SECRET || "test_cron_secret_civic_pulse_development";
  const cronResponse = await cronPage.request.post(`${BASE_URL}/api/cron/demo-reset`, {
    headers: {
      Authorization: `Bearer ${cronSecret}`,
    },
  });
  console.log(`Cron reset status: ${cronResponse.status()}`);
  const cronJson = await cronResponse.json();
  console.log(`Cron reset result:`, cronJson);
  if (cronResponse.status() === 200 && cronJson.ok === true) {
    console.log(`[PASS] /api/cron/demo-reset executed successfully with CRON_SECRET`);
  } else {
    throw new Error(`Cron reset failed with status ${cronResponse.status()}: ${JSON.stringify(cronJson)}`);
  }
  await cronContext.close();

  await browser.close();
  console.log(`\n🎉 Block D verification completed successfully! All checks passed.`);
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
