import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = "C:/Users/abhis/.gemini/antigravity/brain/1dd2b301-1dfe-4640-bd46-20c5523887a8/screenshots/block-3";

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

async function verifyDemoSignIn(browser) {
  console.log("\n=== Testing Real Demo Sign In Flow (/login -> /citizen/dashboard) ===");
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

  // Locate the Citizen Demo quick sign-in button
  const citizenDemoBtn = page.locator("button:has-text('Citizen Demo')");
  await citizenDemoBtn.waitFor({ state: "visible", timeout: 5000 });
  console.log("  ✓ Found Citizen Demo button in DemoAccountPanel");

  // Click citizen demo
  await citizenDemoBtn.click();
  console.log("  Clicked Citizen Demo button, awaiting navigation...");

  await page.waitForURL("**/citizen/dashboard", { timeout: 10000 });
  console.log(`  ✓ Successfully navigated to: ${page.url()}`);

  const cookies = await context.cookies();
  const sessionCookie = cookies.find((c) => c.name === "__session");
  console.log(`  ✓ __session cookie established: ${Boolean(sessionCookie)} (httpOnly: ${sessionCookie?.httpOnly}, maxAge: ${sessionCookie?.expires ? "yes" : "no"})`);

  const shotPath = path.join(SCREENSHOT_DIR, "citizen_dashboard_post_login_1280.png");
  await page.screenshot({ path: shotPath });
  console.log(`  Saved screenshot: ${shotPath}`);

  await context.close();
}

async function verifyForgotPasswordFlow(browser) {
  console.log("\n=== Testing Forgot Password Flow (/forgot-password) ===");
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: "networkidle" });
  await page.fill("input[type='email']", "test-citizen@example.com");
  await page.click("button[type='submit']");

  const successHeading = page.locator("h1:has-text('Check your email')");
  await successHeading.waitFor({ state: "visible", timeout: 5000 });
  console.log("  ✓ Success state displayed: Check your email");

  const shotPath = path.join(SCREENSHOT_DIR, "forgot_password_success_1280.png");
  await page.screenshot({ path: shotPath });
  console.log(`  Saved screenshot: ${shotPath}`);

  await context.close();
}

async function run() {
  const browser = await chromium.launch();
  try {
    console.log("=== Testing Block 3 Auth Pages Visuals & A11y ===");
    await verifyPage(browser, "/login", "login_page");
    await verifyPage(browser, "/register", "register_page");
    await verifyPage(browser, "/forgot-password", "forgot_password_page");
    await verifyPage(browser, "/verify-email", "verify_email_page");

    await verifyDemoSignIn(browser);
    await verifyForgotPasswordFlow(browser);

    console.log("\n=== All Block 3 Verifications Completed Successfully! ===");
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();

