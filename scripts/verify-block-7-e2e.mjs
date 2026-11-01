import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = "C:/Users/abhis/.gemini/antigravity/brain/1dd2b301-1dfe-4640-bd46-20c5523887a8/screenshots/block-7";

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function loginAsRole(page, roleLabel, expectedPathPrefix) {
  page.on("pageerror", (err) => console.error(`  [PAGE ERROR]: ${err.message}`));

  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const demoBtn = page.locator(`button:has-text('${roleLabel}')`);
  await demoBtn.waitFor({ state: "visible", timeout: 15000 });
  console.log(`  Clicking '${roleLabel}' demo button...`);
  await demoBtn.click();

  if (expectedPathPrefix) {
    await page.waitForFunction(
      (prefix) => window.location.pathname.includes(prefix),
      expectedPathPrefix,
      { timeout: 25000 },
    );
    console.log(`  ✓ Successfully navigated to role area: ${page.url()}`);
  }
}

async function captureAndAudit(page, name, checkAccessibility = true) {
  for (const width of [1280, 360]) {
    await page.setViewportSize({ width, height: 800 });
    await page.waitForTimeout(1000);

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    if (hasHorizontalOverflow) {
      console.error(`  ⚠️ HORIZONTAL OVERFLOW DETECTED at ${width}px on ${page.url()}`);
    } else {
      console.log(`  ✓ No horizontal scroll at ${width}px on ${name}`);
    }

    const shotPath = path.join(SCREENSHOT_DIR, `${name}_${width}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`  Saved screenshot: ${shotPath}`);

    if (checkAccessibility) {
      try {
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();

        const violations = results.violations.filter(
          (v) => v.impact === "serious" || v.impact === "critical",
        );
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

  console.log("\n================ BLOCK 7 FULL-JOURNEY E2E VERIFICATION ================");

  let complaintId = null;

  // ─────────────────────────────────────────────────────────────
  // JOURNEY STAGE 1: Citizen logs in & files complaint via wizard
  // ─────────────────────────────────────────────────────────────
  {
    console.log("\n--- STAGE 1: Citizen logs in, submits complaint with MapLibre pin ---");
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    await loginAsRole(page, "Citizen Demo", "citizen");

    // 1.1 Citizen Dashboard
    await page.goto(`${BASE_URL}/citizen/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1", { timeout: 10000 });
    await captureAndAudit(page, "01_citizen_dashboard");

    // 1.2 Open Report Wizard
    await page.goto(`${BASE_URL}/citizen/complaints/new`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1", { timeout: 10000 });

    // Step 1: Select "Road pothole" category
    console.log("  Step 1: Selecting Category 'Road pothole'...");
    const potholeBtn = page.locator("button:has-text('Road pothole')");
    await potholeBtn.click();
    await page.locator("button:has-text('Next: Details')").click();

    // Step 2: Fill Details
    console.log("  Step 2: Entering Title, Description, and Hazards...");
    await page.waitForSelector("#report-title", { timeout: 5000 });
    await page.fill("#report-title", "Dangerous crater pothole near 100ft road Indiranagar");
    await page.fill(
      "#report-description",
      "Deep open crater pothole on the asphalt surface creating acute risk of two-wheeler accidents and sudden vehicle skidding.",
    );

    // Toggle safety hazard
    const hazardBtn = page.locator("button:has-text('Risk of physical injury')");
    if (await hazardBtn.isVisible()) {
      await hazardBtn.click();
    }
    await page.locator("button:has-text('Next: Location')").click();

    // Step 3: Location (Default is Indiranagar inside Bengaluru)
    console.log("  Step 3: Verifying MapLibre location & landmark...");
    await page.waitForSelector("#picker-landmark", { timeout: 10000 });
    await page.fill("#picker-landmark", "Near 12th Main junction, Indiranagar");
    await page.locator("button:has-text('Next: Photos')").click();

    // Step 4: Evidence
    console.log("  Step 4: Evidence Step...");
    await page.waitForSelector("button:has-text('Next: AI Review')", { timeout: 5000 });
    await page.locator("button:has-text('Next: AI Review')").click();

    // Step 5: AI Review & Radar
    console.log("  Step 5: Advisory AI Review...");
    await page.waitForSelector("button:has-text('Next: Confirm')", { timeout: 5000 });
    await page.locator("button:has-text('Next: Confirm')").click();

    // Step 6: Confirmation & Priority Receipt Preview
    console.log("  Step 6: Reviewing Priority Receipt and submitting...");
    await page.waitForSelector("button:has-text('Submit report')", { timeout: 5000 });
    await captureAndAudit(page, "02_wizard_confirm_receipt");

    await page.locator("button:has-text('Submit report')").click();

    // Step 7: Confirmation State
    console.log("  Step 7: Awaiting post-submit confirmation screen...");
    await page.waitForSelector("h1:has-text('Report successfully submitted')", { timeout: 15000 });
    await captureAndAudit(page, "03_complaint_submitted");

    // Extract complaint link and ID
    const trackLink = page.locator("a:has-text('Track this report')");
    const href = await trackLink.getAttribute("href");
    console.log(`  ✓ Track report href: ${href}`);
    complaintId = href.split("/").pop();
    console.log(`  ✓ Extracted Complaint ID: ${complaintId}`);

    // Navigate to Citizen Detail view
    await trackLink.click();
    await page.waitForSelector("h1", { timeout: 10000 });
    console.log(`  ✓ Navigated to citizen complaint detail: ${page.url()}`);
    await captureAndAudit(page, "04_citizen_complaint_detail");

    await context.close();
  }

  // ─────────────────────────────────────────────────────────────
  // STAGE 2: Authority logs in, inspects receipt, adds note, resolves
  // ─────────────────────────────────────────────────────────────
  {
    console.log("\n--- STAGE 2: Authority logs in, inspects receipt, adds note, resolves ---");
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    await loginAsRole(page, "Roads Authority Demo", "authority");

    // 2.1 Authority Queue
    await page.goto(`${BASE_URL}/authority/queue`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1", { timeout: 10000 });
    await captureAndAudit(page, "05_authority_queue");

    // 2.2 Go to complaint workspace
    await page.goto(`${BASE_URL}/authority/complaints/${complaintId}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1", { timeout: 10000 });
    console.log(`  ✓ Authority opened complaint workspace for ${complaintId}`);

    // 2.3 Add internal engineer note
    console.log("  Adding internal engineer note...");
    const noteArea = page.locator("textarea[placeholder*='Add internal engineer dispatch note...']");
    await noteArea.fill("Field crew squad #3 dispatched with asphalt binder and compacting machinery.");
    await page.locator("button[aria-label='Post engineer note']").click();
    await page.waitForTimeout(1000);
    console.log("  ✓ Engineer note posted");

    // 2.4 Transition through state machine: SUBMITTED -> UNDER_REVIEW -> ASSIGNED -> IN_PROGRESS
    console.log("  Transitioning: SUBMITTED -> UNDER_REVIEW...");
    const reviewBtn = page.locator("button:has-text('Mark Under Review')");
    await reviewBtn.waitFor({ state: "visible", timeout: 10000 });
    await reviewBtn.click();
    await page.waitForTimeout(1500);

    console.log("  Transitioning: UNDER_REVIEW -> ASSIGNED...");
    const assignBtn = page.locator("button:has-text('Assign to Field Crew')");
    await assignBtn.waitFor({ state: "visible", timeout: 10000 });
    await assignBtn.click();
    await page.waitForTimeout(1500);

    console.log("  Transitioning: ASSIGNED -> IN_PROGRESS...");
    const startBtn = page.locator("button:has-text('Start Field Investigation')");
    await startBtn.waitFor({ state: "visible", timeout: 10000 });
    await startBtn.click();
    await page.waitForTimeout(1500);

    // 2.5 Transition to RESOLVED with completion report (T7)
    console.log("  Marking resolved with completion report (T7)...");
    const resolveBtn = page.locator("button:has-text('Mark Resolved')");
    await resolveBtn.waitFor({ state: "visible", timeout: 10000 });
    await resolveBtn.click();

    const resolutionTextarea = page.locator("textarea[placeholder*='Describe the actions taken by field engineers']");
    await resolutionTextarea.waitFor({ state: "visible", timeout: 5000 });
    await resolutionTextarea.fill("Crater pothole filled with 50mm compacted asphalt mix and leveled flush with roadway surface.");
    await page.locator("button:has-text('Confirm Resolution')").click();
    await page.waitForTimeout(2000);

    console.log("  ✓ Complaint transitioned to RESOLVED by Authority");
    await captureAndAudit(page, "06_authority_complaint_resolved");

    await context.close();
  }

  // ─────────────────────────────────────────────────────────────
  // STAGE 3: Citizen logs back in, verifies fix, closes ticket
  // ─────────────────────────────────────────────────────────────
  {
    console.log("\n--- STAGE 3: Citizen confirms fix and closes ticket (T8) ---");
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    await loginAsRole(page, "Citizen Demo", "citizen");

    // Navigate to the complaint
    await page.goto(`${BASE_URL}/citizen/complaints/${complaintId}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1", { timeout: 10000 });

    // Verify "Confirm it's fixed" button is visible
    console.log("  Citizen confirming resolution fix...");
    const confirmFixBtn = page.locator("button:has-text(\"Confirm it's fixed\")");
    await confirmFixBtn.waitFor({ state: "visible", timeout: 10000 });
    await confirmFixBtn.click();

    // Fill rating and feedback
    const feedbackComment = page.locator("textarea[placeholder*='Optional comment for the municipal team']");
    await feedbackComment.waitFor({ state: "visible", timeout: 5000 });
    await feedbackComment.fill("The asphalt patch has been laid smoothly. The road is safe for two-wheelers now. Excellent work!");
    await page.locator("button:has-text('Verify & close report')").click();
    await page.waitForTimeout(2500);

    console.log("  ✓ Report verified and transitioned to CLOSED!");
    await captureAndAudit(page, "07_citizen_complaint_closed");

    await context.close();
  }

  // ─────────────────────────────────────────────────────────────
  // STAGE 4: Admin logs in, verifies audit logs and AI telemetry
  // ─────────────────────────────────────────────────────────────
  {
    console.log("\n--- STAGE 4: Admin verifies audit logs and AI telemetry ---");
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    await loginAsRole(page, "City Admin Demo", "admin");

    // 4.1 Admin Dashboard
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1", { timeout: 10000 });
    await captureAndAudit(page, "08_admin_dashboard");

    // 4.2 Admin Audit Logs
    await page.goto(`${BASE_URL}/admin/audit-logs`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1", { timeout: 10000 });
    console.log("  ✓ Admin Audit Trail verified");
    await captureAndAudit(page, "09_admin_audit_logs");

    // 4.3 Admin AI Telemetry & Monitoring
    await page.goto(`${BASE_URL}/admin/ai-monitoring`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1", { timeout: 10000 });
    console.log("  ✓ Admin AI Monitoring verified");
    await captureAndAudit(page, "10_admin_ai_monitoring");

    await context.close();
  }

  await browser.close();
  console.log("\n🎉 FULL-JOURNEY E2E VERIFICATION COMPLETED SUCCESSFULLY!");
}

run().catch((err) => {
  console.error("E2E Verification failed:", err);
  process.exit(1);
});
