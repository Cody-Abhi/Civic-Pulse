import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const SCREENSHOT_DIR = path.resolve(process.cwd(), "docs/screenshots/block_f");

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function run() {
  console.log(`Starting Block F (Adaption Multilingual Evaluation) verification against ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: "360", width: 360, height: 780 },
    { name: "1280", width: 1280, height: 800 },
  ];

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`Testing Block F Viewport: ${vp.name}px (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    // Login as Admin
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.locator('button:has-text("Admin (View-Only) Demo"), button:has-text("Admin (View-Only)")').first().click();
    await page.waitForURL("**/admin/dashboard", { timeout: 15000 });
    console.log(`[PASS] Admin logged in at ${vp.name}px`);

    // Navigate to AI Monitoring
    await page.goto(`${BASE_URL}/admin/ai-monitoring`, { waitUntil: "domcontentloaded" });
    const adaptionSection = page.locator('section[aria-label="Multilingual evaluation (Adaption)"]').first();
    await adaptionSection.waitFor({ state: "visible", timeout: 10000 });
    console.log(`[PASS] Multilingual evaluation (Adaption) panel visible at ${vp.name}px`);

    // Verify Offline Evaluation Badge
    const offlineBadge = adaptionSection.locator('text="Offline Evaluation"').first();
    await offlineBadge.waitFor({ state: "visible", timeout: 5000 });
    console.log(`[PASS] 'Offline Evaluation' badge verified at ${vp.name}px`);

    // Verify Language Accuracies
    const enText = await adaptionSection.locator('text="English (en)"').count();
    const hiText = await adaptionSection.locator('text="Hindi · हिन्दी (hi)"').count();
    const knText = await adaptionSection.locator('text="Kannada · ಕನ್ನಡ (kn)"').count();

    if (enText === 0 || hiText === 0 || knText === 0) {
      throw new Error(`Missing expected language breakdown (en:${enText}, hi:${hiText}, kn:${knText})`);
    }
    console.log(`[PASS] All 3 languages (English, Hindi, Kannada) verified in breakdown at ${vp.name}px`);

    // Scroll section into view for screenshot
    await adaptionSection.scrollIntoViewIfNeeded();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `01_admin_ai_monitoring_adaption_${vp.name}.png`),
      fullPage: false,
    });

    await context.close();
  }

  await browser.close();
  console.log(`\n🎉 Block F verification completed successfully! All checks passed.`);
}

run().catch((err) => {
  console.error("Block F Verification failed:", err);
  process.exit(1);
});

