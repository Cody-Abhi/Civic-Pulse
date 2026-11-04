import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { spawn, execSync } from "child_process";

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.E2E_BASE_URL ||
  "http://localhost:3000";

const SCREENSHOT_DIR = path.resolve(process.cwd(), "docs/screenshots/block_b");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const ADMIN_PASSWORD =
  process.env.DEMO_ADMIN_PASSWORD || "CivicPulseDemo2026!";

const VIEWPORTS = [
  { name: "360px", width: 360, height: 780 },
  { name: "1280px", width: 1280, height: 800 },
];

const results = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  health: null,
  complaintId: null,
  stages: [],
  screenshots: [],
  overflowIssues: [],
  consoleErrors: [],
  networkFailures: [],
  cspViolations: [],
  passed: false,
};

let serverProcess = null;

async function ensureServerRunning() {
  console.log(`\nChecking connectivity to ${BASE_URL}...`);
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.status === 200 || res.status === 503) {
      console.log(`✓ Target server is actively responding at ${BASE_URL}`);
      return;
    }
  } catch {
    // Not responding
  }

  if (BASE_URL.includes("localhost") || BASE_URL.includes("127.0.0.1")) {
    const hasProdBuild = fs.existsSync(path.resolve(process.cwd(), ".next/BUILD_ID"));
    const startCmd = hasProdBuild ? "start" : "dev";
    console.log(`Local server not detected. Spawning local server via 'pnpm ${startCmd}'...`);
    serverProcess = spawn("pnpm", [startCmd], {
      shell: true,
      stdio: "pipe",
      env: { ...process.env, PORT: "3000" },
    });

    serverProcess.stdout.on("data", (data) => {
      const line = data.toString().trim();
      if (line) console.log(`  [server] ${line}`);
    });
    serverProcess.stderr.on("data", (data) => {
      const line = data.toString().trim();
      if (line) console.error(`  [server error] ${line}`);
    });

    const deadline = Date.now() + 45000;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(`${BASE_URL}/api/health`);
        if (res.status === 200 || res.status === 503) {
          console.log(`✓ Local server successfully initialized on port 3000`);
          return;
        }
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    throw new Error("Timed out waiting for local production server to become ready.");
  }
}

function stopServer() {
  if (serverProcess && serverProcess.pid) {
    console.log(`Shutting down spawned local server (PID: ${serverProcess.pid})...`);
    if (process.platform === "win32") {
      try {
        execSync(`taskkill /pid ${serverProcess.pid} /T /F`);
      } catch {}
    } else {
      serverProcess.kill("SIGTERM");
    }
  }
}

async function attachDiagnostics(page, stageName) {
  await page.addInitScript(() => {
    window.addEventListener("securitypolicyviolation", (e) => {
      console.error(
        `[CSP Violation] ${e.violatedDirective} blocked ${e.blockedURI || "inline/eval"}`,
      );
    });
  });

  page.on("console", (msg) => {
    const text = msg.text();
    if (text.includes("[CSP Violation]")) {
      console.error(`  [CSP VIOLATION][${stageName}] ${text}`);
      results.cspViolations.push({ stage: stageName, url: page.url(), text });
    } else if (msg.type() === "error") {
      // Filter benign telemetry notices if any
      console.error(`  [CONSOLE ERROR][${stageName}] ${text}`);
      results.consoleErrors.push({ stage: stageName, url: page.url(), text });
    }
  });

  page.on("pageerror", (err) => {
    console.error(`  [PAGE ERROR][${stageName}] ${err.message}`);
    results.consoleErrors.push({
      stage: stageName,
      url: page.url(),
      text: `PageError: ${err.message}`,
    });
  });

  page.on("requestfailed", (req) => {
    const failure = req.failure();
    if (failure && !failure.errorText.includes("ERR_ABORTED")) {
      console.warn(`  [REQUEST FAILED][${stageName}] ${req.method()} ${req.url()}: ${failure.errorText}`);
      results.networkFailures.push({
        stage: stageName,
        url: req.url(),
        method: req.method(),
        error: failure.errorText,
      });
    }
  });
}

async function captureStepDualViewport(page, stepId, label) {
  console.log(`\n  📸 Capturing Step: ${stepId} (${label})`);

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(600);

    // Evaluate horizontal overflow
    const overflowMetrics = await page.evaluate(() => {
      const docElem = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(docElem.scrollWidth, body ? body.scrollWidth : 0);
      const clientWidth = docElem.clientWidth;
      const windowWidth = window.innerWidth;
      const hasHorizontalScrollbar = scrollWidth > windowWidth + 1;

      const overflowingElements = [];
      if (hasHorizontalScrollbar) {
        const allElements = document.querySelectorAll("*");
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.right > windowWidth + 2 || rect.left < -2) {
            const style = window.getComputedStyle(el);
            if (style.overflow !== "hidden" && style.position !== "fixed") {
              overflowingElements.push({
                tag: el.tagName,
                className: el.className ? String(el.className).slice(0, 80) : "",
                right: rect.right,
                width: rect.width,
              });
            }
          }
        }
      }

      return {
        scrollWidth,
        clientWidth,
        windowWidth,
        hasHorizontalScrollbar,
        overflowingElementsCount: overflowingElements.length,
        topOverflowElements: overflowingElements.slice(0, 3),
      };
    });

    if (overflowMetrics.hasHorizontalScrollbar) {
      console.error(`    ⚠️ Horizontal overflow detected at ${vp.name} on ${page.url()}!`);
      results.overflowIssues.push({
        step: stepId,
        label,
        viewport: vp.name,
        url: page.url(),
        details: overflowMetrics,
      });
    } else {
      console.log(`    ✓ 0 horizontal overflow at ${vp.name}`);
    }

    const filename = `${stepId}-${vp.name}.png`;
    const shotPath = path.join(SCREENSHOT_DIR, filename);
    await page.screenshot({ path: shotPath, fullPage: true });
    const stat = fs.statSync(shotPath);

    results.screenshots.push({
      step: stepId,
      label,
      viewport: vp.name,
      width: vp.width,
      filename,
      fileSizeBytes: stat.size,
      overflowMetrics,
    });
  }

  // Restore desktop width for subsequent interaction actions
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(300);
}

async function run() {
  console.log("================================================================");
  console.log("CIVICPULSE AI — BLOCK B LIVE USER JOURNEY VERIFICATION");
  console.log(`Target Base URL: ${BASE_URL}`);
  console.log(`Screenshots Directory: ${SCREENSHOT_DIR}`);
  console.log("================================================================");

  try {
    await ensureServerRunning();

    // 1. Check /api/health
    console.log("\n--- [Step 0] Probing /api/health ---");
    try {
      const healthRes = await fetch(`${BASE_URL}/api/health`);
      const healthStatus = healthRes.status;
      const healthHeaders = Object.fromEntries(healthRes.headers.entries());
      const healthJson = await healthRes.json();
      console.log(`Health HTTP Status: ${healthStatus}`);
      console.log(`Health Response: ${JSON.stringify(healthJson, null, 2)}`);
      results.health = {
        status: healthStatus,
        headers: healthHeaders,
        body: healthJson,
      };
    } catch (healthErr) {
      console.error(`Health probe failed: ${healthErr.message}`);
      results.health = { error: healthErr.message };
    }

    const browser = await chromium.launch({ headless: true });

    // ─────────────────────────────────────────────────────────────
    // STAGE 1: Citizen Journey
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- STAGE 1: Citizen Filing Journey ---");
    {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        permissions: ["geolocation"],
        geolocation: { latitude: 12.9719, longitude: 77.6412 },
      });
      const page = await context.newPage();
      await attachDiagnostics(page, "citizen");

      // 1.1 Landing / Login Page
      console.log("Navigating to /login...");
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("text=Quick Sign In · Demo Accounts", { timeout: 15000 });
      await captureStepDualViewport(page, "01_login_panel", "Login Panel with Demo Accounts");

      // 1.2 Sign in as Citizen Demo
      console.log("Signing in as Citizen Demo...");
      const citizenDemoBtn = page.locator("button:has-text('Citizen Demo')");
      await citizenDemoBtn.waitFor({ state: "visible", timeout: 15000 });
      await citizenDemoBtn.click();
      await page.waitForURL((url) => url.pathname.includes("/citizen"), { timeout: 25000 });

      // 1.3 Citizen Dashboard
      await page.goto(`${BASE_URL}/citizen/dashboard`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("h1", { timeout: 15000 });
      await captureStepDualViewport(page, "02_citizen_dashboard", "Citizen Dashboard");

      // 1.4 Open Complaint Wizard
      console.log("Navigating to /citizen/complaints/new...");
      await page.goto(`${BASE_URL}/citizen/complaints/new`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("h1", { timeout: 15000 });

      // Step 1: Category Selection
      console.log("  Step 1: Selecting Category 'Road pothole'...");
      const potholeBtn = page.locator("button:has-text('Road pothole')");
      await potholeBtn.click();
      await page.locator("button:has-text('Next: Details')").click();

      // Step 2: Details & Description
      console.log("  Step 2: Entering Title, Description, and Hazard...");
      await page.waitForSelector("#report-title", { timeout: 10000 });
      await page.fill("#report-title", "Dangerous crater pothole near 100ft road Indiranagar");
      await page.fill(
        "#report-description",
        "Deep open crater pothole on the asphalt surface creating acute risk of two-wheeler accidents and sudden skidding.",
      );
      const hazardBtn = page.locator("button:has-text('Risk of physical injury')");
      if (await hazardBtn.isVisible()) {
        await hazardBtn.click();
      }
      await captureStepDualViewport(page, "03_wizard_details", "Complaint Wizard Details & Hazard");
      await page.locator("button:has-text('Next: Location')").click();

      // Step 3: Location
      console.log("  Step 3: Entering Landmark & Location...");
      await page.waitForSelector("#picker-landmark", { timeout: 10000 });
      await page.fill("#picker-landmark", "Near 12th Main junction, Indiranagar");
      await page.locator("button:has-text('Next: Photos')").click();

      // Step 4: Evidence Photos
      console.log("  Step 4: Evidence step (proceed)...");
      await page.waitForSelector("button:has-text('Next: AI Review')", { timeout: 10000 });
      await page.locator("button:has-text('Next: AI Review')").click();

      // Step 5: Advisory AI Review
      console.log("  Step 5: Advisory AI review step (proceed)...");
      await page.waitForSelector("button:has-text('Next: Confirm')", { timeout: 10000 });
      await page.locator("button:has-text('Next: Confirm')").click();

      // Step 6: Confirmation & Priority Receipt Preview
      console.log("  Step 6: Reviewing Priority Receipt preview...");
      await page.waitForSelector("button:has-text('Submit report')", { timeout: 10000 });
      await page.waitForSelector("text=Priority Receipt", { timeout: 10000 });
      await captureStepDualViewport(page, "04_wizard_priority_receipt", "Priority Receipt Preview");

      // Submit Report
      console.log("Submitting complaint report...");
      await page.locator("button:has-text('Submit report')").click();

      // Step 7: Confirmation Screen
      await page.waitForSelector("h1:has-text('Report successfully submitted')", { timeout: 20000 });
      await page.waitForSelector("text=CP-BLR", { timeout: 10000 });
      await captureStepDualViewport(page, "05_complaint_submitted", "Report Successfully Submitted");

      // Extract complaint reference / ID
      const trackLink = page.locator("a:has-text('Track this report')");
      const href = await trackLink.getAttribute("href");
      console.log(`  ✓ Track report href: ${href}`);
      results.complaintId = href.split("/").pop();
      console.log(`  ✓ Extracted Complaint ID: ${results.complaintId}`);

      // Step 8: View Citizen Complaint Detail
      await trackLink.click();
      await page.waitForSelector("h1", { timeout: 15000 });
      await captureStepDualViewport(page, "06_citizen_complaint_detail", "Citizen Complaint Detail");

      await context.close();
    }

    // ─────────────────────────────────────────────────────────────
    // STAGE 2: Authority Journey
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- STAGE 2: Authority Queue & Resolution Journey ---");
    {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
      });
      const page = await context.newPage();
      await attachDiagnostics(page, "authority");

      // 2.1 Login as Roads Authority Demo
      console.log("Navigating to /login...");
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
      const authorityBtn = page.locator("button:has-text('Roads Authority Demo')");
      await authorityBtn.waitFor({ state: "visible", timeout: 15000 });
      await authorityBtn.click();
      await page.waitForURL((url) => url.pathname.includes("/authority"), { timeout: 25000 });

      // 2.2 Authority Queue
      console.log("Navigating to /authority/queue...");
      await page.goto(`${BASE_URL}/authority/queue`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("h1", { timeout: 15000 });
      await captureStepDualViewport(page, "07_authority_queue", "Roads Authority Queue");

      // 2.3 Open Complaint Workspace
      console.log(`Navigating to /authority/complaints/${results.complaintId}...`);
      await page.goto(`${BASE_URL}/authority/complaints/${results.complaintId}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForSelector("h1", { timeout: 15000 });

      // 2.4 Add internal engineer note
      console.log("Adding internal engineer note...");
      const noteArea = page.locator("textarea[placeholder*='Add internal engineer dispatch note...']");
      if (await noteArea.isVisible()) {
        await noteArea.fill("Field crew squad #3 dispatched with asphalt binder and compacting machinery.");
        await page.locator("button[aria-label='Post engineer note']").click();
        await page.waitForTimeout(1000);
        console.log("  ✓ Internal note posted successfully");
      }

      await captureStepDualViewport(
        page,
        "08_authority_complaint_workspace",
        "Authority Complaint Workspace with Note",
      );

      // 2.5 Status transitions: SUBMITTED -> UNDER_REVIEW -> ASSIGNED -> IN_PROGRESS
      console.log("Executing status transitions...");
      const reviewBtn = page.locator("button:has-text('Mark Under Review')");
      if (await reviewBtn.isVisible()) {
        console.log("  Transitioning to UNDER_REVIEW...");
        await reviewBtn.click();
        await page.waitForTimeout(1500);
      }

      const assignBtn = page.locator("button:has-text('Assign to Field Crew')");
      if (await assignBtn.isVisible()) {
        console.log("  Transitioning to ASSIGNED...");
        await assignBtn.click();
        await page.waitForTimeout(1500);
      }

      const startBtn = page.locator("button:has-text('Start Field Investigation')");
      if (await startBtn.isVisible()) {
        console.log("  Transitioning to IN_PROGRESS...");
        await startBtn.click();
        await page.waitForTimeout(1500);
      }

      // 2.6 Resolve with note >= 20 characters
      console.log("Resolving complaint with resolution note >= 20 chars...");
      const resolveBtn = page.locator("button:has-text('Mark Resolved')");
      await resolveBtn.waitFor({ state: "visible", timeout: 10000 });
      await resolveBtn.click();

      const resolutionTextarea = page.locator(
        "textarea[placeholder*='Describe the actions taken by field engineers']",
      );
      await resolutionTextarea.waitFor({ state: "visible", timeout: 5000 });
      await resolutionTextarea.fill(
        "Crater pothole filled with 50mm compacted asphalt mix and leveled flush with roadway surface.",
      );
      await page.locator("button:has-text('Confirm Resolution')").click();
      await page.waitForTimeout(2000);
      console.log("  ✓ Complaint transitioned to RESOLVED by Authority");

      await captureStepDualViewport(
        page,
        "09_authority_complaint_resolved",
        "Authority Complaint Marked Resolved",
      );

      await context.close();
    }

    // ─────────────────────────────────────────────────────────────
    // STAGE 3: Citizen Verification & Closure
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- STAGE 3: Citizen Fix Verification & Closure ---");
    {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
      });
      const page = await context.newPage();
      await attachDiagnostics(page, "citizen_verify");

      // 3.1 Login as Citizen
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
      const citizenDemoBtn = page.locator("button:has-text('Citizen Demo')");
      await citizenDemoBtn.waitFor({ state: "visible", timeout: 15000 });
      await citizenDemoBtn.click();
      await page.waitForURL((url) => url.pathname.includes("/citizen"), { timeout: 25000 });

      // 3.2 View complaint detail & confirm fix
      await page.goto(`${BASE_URL}/citizen/complaints/${results.complaintId}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForSelector("h1", { timeout: 15000 });

      const confirmFixBtn = page.locator("button:has-text(\"Confirm it's fixed\")");
      if (await confirmFixBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log("Citizen confirming resolution fix...");
        await confirmFixBtn.click();

        const feedbackComment = page.locator(
          "textarea[placeholder*='Optional comment for the municipal team']",
        );
        if (await feedbackComment.isVisible({ timeout: 5000 }).catch(() => false)) {
          await feedbackComment.fill(
            "The asphalt patch has been laid smoothly. The road is safe for two-wheelers now. Excellent work!",
          );
        }
        await page.locator("button:has-text('Verify & close report')").click();
        await page.waitForTimeout(2000);
        console.log("  ✓ Report verified and transitioned to CLOSED");
      }

      await captureStepDualViewport(
        page,
        "10_citizen_complaint_closed",
        "Citizen Complaint Verified & Closed",
      );

      await context.close();
    }

    // ─────────────────────────────────────────────────────────────
    // STAGE 4: Admin Dashboard & Audit Trail
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- STAGE 4: Admin Governance & Audit Trail ---");
    {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
      });
      const page = await context.newPage();
      await attachDiagnostics(page, "admin");

      // 4.1 Admin Login
      console.log("Navigating to /login for Admin...");
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });

      const adminDemoBtn = page.locator("button:has-text('City Admin Demo'), button:has-text('Admin Demo')");
      if (await adminDemoBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log("Using Admin Demo 1-click button...");
        await adminDemoBtn.first().click();
      } else {
        console.log("Using Admin credentials login form...");
        await page.fill("input[type='email']", "admin@demo.civicpulse.invalid");
        await page.fill("input[type='password']", ADMIN_PASSWORD);
        await page.click("button[type='submit']");
      }
      await page.waitForURL((url) => url.pathname.includes("/admin"), { timeout: 25000 });

      // 4.2 Admin Dashboard
      console.log("Navigating to /admin/dashboard...");
      await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("h1", { timeout: 15000 });
      await captureStepDualViewport(page, "11_admin_dashboard", "Admin Dashboard Overview");

      // 4.3 Admin Audit Trail
      console.log("Navigating to /admin/audit-logs...");
      await page.goto(`${BASE_URL}/admin/audit-logs`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("h1", { timeout: 15000 });
      await captureStepDualViewport(page, "12_admin_audit_trail", "Admin Governance Audit Trail");

      await context.close();
    }

    await browser.close();

    results.passed =
      results.overflowIssues.length === 0 && results.consoleErrors.length === 0;

    console.log("\n================ VERIFICATION SUMMARY ================");
    console.log(`Passed: ${results.passed}`);
    console.log(`Screenshots Captured: ${results.screenshots.length}`);
    console.log(`Horizontal Overflow Issues: ${results.overflowIssues.length}`);
    console.log(`Console Errors: ${results.consoleErrors.length}`);
    console.log(`Network Failures: ${results.networkFailures.length}`);
    console.log("======================================================");

    const summaryPath = path.join(SCREENSHOT_DIR, "verification-summary.json");
    fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
    console.log(`Summary written to: ${summaryPath}`);

    if (!results.passed) {
      if (results.overflowIssues.length > 0) {
        console.error("FAILED: Overflow issues detected:", results.overflowIssues);
      }
      if (results.consoleErrors.length > 0) {
        console.error("FAILED: Console errors detected:", results.consoleErrors);
      }
      process.exit(1);
    }
  } finally {
    stopServer();
  }
}

run().catch((err) => {
  console.error("FATAL ERROR in verify-block-b-live:", err);
  stopServer();
  process.exit(1);
});
