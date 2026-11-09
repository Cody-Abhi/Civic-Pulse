import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "docs/screenshots/block_e");

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function run() {
  console.log(`Starting Block E verification against ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: "360", width: 360, height: 780 },
    { name: "1280", width: 1280, height: 800 },
  ];

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`Testing Block E Viewport: ${vp.name}px (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    // 1. /about page: Model name, no overclaims, no PRD references
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/about`, { waitUntil: "domcontentloaded" });
      const bodyText = await page.innerText("body");

      // Verify no "Gemini 2.5 Flash"
      if (bodyText.includes("Gemini 2.5 Flash") || bodyText.includes("gemini-2.5-flash")) {
        throw new Error("Found hardcoded 'Gemini 2.5 Flash' on /about page!");
      }
      // Verify no "zero downtime"
      if (bodyText.includes("zero downtime")) {
        throw new Error("Found overclaim 'zero downtime' on /about page!");
      }
      // Verify no "(PRD §30)"
      if (bodyText.includes("(PRD §30)")) {
        throw new Error("Found spec citation '(PRD §30)' on /about page!");
      }

      console.log(`[PASS] /about methodology verified clean of overclaims and 2.5 models at ${vp.name}px`);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `01_about_methodology_${vp.name}.png`),
        fullPage: false,
      });
      await context.close();
    }

    // 2. Admin AI Monitoring: dynamic model configuration
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
      await page.locator('button:has-text("Admin (View-Only) Demo"), button:has-text("Admin (View-Only)")').first().click();
      await page.waitForURL("**/admin/dashboard", { timeout: 15000 });

      await page.goto(`${BASE_URL}/admin/ai-monitoring`, { waitUntil: "domcontentloaded" });
      const modelConfigCard = page.locator('text="Active model configuration"').first();
      await modelConfigCard.waitFor({ state: "visible", timeout: 10000 });

      const aiText = await page.innerText("body");
      if (aiText.includes("Gemini 2.5 Flash")) {
        throw new Error("Found hardcoded 'Gemini 2.5 Flash' on /admin/ai-monitoring!");
      }

      console.log(`[PASS] /admin/ai-monitoring active model configuration verified at ${vp.name}px`);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `02_admin_ai_monitoring_model_config_${vp.name}.png`),
        fullPage: false,
      });
      await context.close();
    }

    // 3. Authority Profile: Work email
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
      await page.locator('button:has-text("Roads Authority Demo")').first().click();
      await page.waitForURL("**/authority/**", { timeout: 15000 });

      await page.goto(`${BASE_URL}/authority/profile`, { waitUntil: "domcontentloaded" });
      const workEmailLabel = page.locator('text="Work email"').first();
      await workEmailLabel.waitFor({ state: "visible", timeout: 10000 });

      console.log(`[PASS] /authority/profile 'Work email' verified at ${vp.name}px`);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `03_authority_profile_work_email_${vp.name}.png`),
        fullPage: false,
      });
      await context.close();
    }

    // 4. Public Complaints Feed & Detail
    {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/explore`, { waitUntil: "domcontentloaded" });
      const complaintLink = page.locator('a[href^="/complaints/CP-BLR-"]').first();
      await complaintLink.waitFor({ state: "visible", timeout: 10000 });
      const targetHref = await complaintLink.getAttribute("href");
      console.log(`[PASS] Found public complaint link: ${targetHref} at ${vp.name}px`);

      if (targetHref) {
        await page.goto(`${BASE_URL}${targetHref}`, { waitUntil: "domcontentloaded" });
      }

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `04_public_resolution_note_${vp.name}.png`),
        fullPage: false,
      });
      await context.close();
    }
  }

  await browser.close();
  console.log(`\n🎉 Block E verification completed successfully! All checks passed.`);
}

run().catch((err) => {
  console.error("Block E Verification failed:", err);
  process.exit(1);
});
