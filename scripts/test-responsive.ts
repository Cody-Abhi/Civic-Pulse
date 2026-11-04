import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

async function runResponsiveCheck() {
  const screenshotsDir = path.resolve(process.cwd(), "docs/screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: "mobile-360px", width: 360, height: 780 },
    { name: "desktop-1280px", width: 1280, height: 800 },
  ];

  for (const vp of viewports) {
    console.log(`📱 Checking viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("http://localhost:3001/login", { waitUntil: "networkidle" });

    // Verify demo account panel elements exist
    const panelHeader = page.locator("text=Quick Sign In · Demo Accounts");
    await panelHeader.waitFor({ state: "visible", timeout: 5000 });

    const citizenCard = page.locator("text=Citizen Demo");
    await citizenCard.waitFor({ state: "visible", timeout: 5000 });

    const roadsCard = page.locator("text=Roads Authority Demo");
    await roadsCard.waitFor({ state: "visible", timeout: 5000 });

    // Capture screenshot
    const screenshotPath = path.join(screenshotsDir, `login-${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`  ✓ Screenshot saved: ${screenshotPath}`);

    // Check errors
    if (consoleErrors.length > 0) {
      console.warn(`  ⚠️ Console errors captured:`, consoleErrors);
    } else {
      console.log(`  ✓ Zero console errors.`);
    }

    await context.close();
  }

  await browser.close();
  console.log("✅ Responsive checks completed successfully.");
}

runResponsiveCheck().catch((err) => {
  console.error("❌ Responsive check failed:", err);
  process.exit(1);
});
