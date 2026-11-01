import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import * as fs from "fs";
import * as path from "path";

const ARTIFACT_DIR = "C:/Users/abhis/.gemini/antigravity/brain/1dd2b301-1dfe-4640-bd46-20c5523887a8/screenshots/block-1";
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const VIEWPORTS = [
  { width: 360, height: 780, name: "360" },
  { width: 1280, height: 800, name: "1280" },
];

async function verifyBlock1() {
  console.log("=== Testing Block 1 Security API Endpoints via HTTP ===");

  // 1. Unauthenticated PATCH /api/complaints/synthetic-000001/status -> 401 UNAUTHENTICATED
  const statusRes = await fetch("http://localhost:3000/api/complaints/synthetic-000001/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
    body: JSON.stringify({ status: "UNDER_REVIEW" }),
  });
  const statusJson = await statusRes.json();
  console.log("Unauthenticated PATCH /api/complaints/[id]/status:", statusRes.status, statusJson);
  if (statusRes.status !== 401 || statusJson.error?.code !== "UNAUTHENTICATED") {
    throw new Error(`Expected 401 UNAUTHENTICATED, got ${statusRes.status}`);
  }

  // 2. Unauthenticated PATCH /api/complaints/synthetic-000001/priority -> 401 UNAUTHENTICATED
  const priorityRes = await fetch("http://localhost:3000/api/complaints/synthetic-000001/priority", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
    body: JSON.stringify({ adjustment: 5, rationale: "Testing priority" }),
  });
  const priorityJson = await priorityRes.json();
  console.log("Unauthenticated PATCH /api/complaints/[id]/priority:", priorityRes.status, priorityJson);
  if (priorityRes.status !== 401 || priorityJson.error?.code !== "UNAUTHENTICATED") {
    throw new Error(`Expected 401 UNAUTHENTICATED, got ${priorityRes.status}`);
  }

  // 3. Unauthenticated POST /api/complaints/duplicates/check -> 401 UNAUTHENTICATED
  const dupRes = await fetch("http://localhost:3000/api/complaints/duplicates/check", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
    body: JSON.stringify({ lat: 12.97, lng: 77.59, text: "testing pothole query" }),
  });
  const dupJson = await dupRes.json();
  console.log("Unauthenticated POST /api/complaints/duplicates/check:", dupRes.status, dupJson);
  if (dupRes.status !== 401 || dupJson.error?.code !== "UNAUTHENTICATED") {
    throw new Error(`Expected 401 UNAUTHENTICATED, got ${dupRes.status}`);
  }

  // 4. Unauthenticated GET /api/analytics/insights -> 401 UNAUTHENTICATED
  const insightsRes = await fetch("http://localhost:3000/api/analytics/insights");
  const insightsJson = await insightsRes.json();
  console.log("Unauthenticated GET /api/analytics/insights:", insightsRes.status, insightsJson);
  if (insightsRes.status !== 401 || insightsJson.error?.code !== "UNAUTHENTICATED") {
    throw new Error(`Expected 401 UNAUTHENTICATED, got ${insightsRes.status}`);
  }

  // 5. Public GET /api/metrics -> 200 OK with x-request-id
  const metricsRes = await fetch("http://localhost:3000/api/metrics");
  const reqId = metricsRes.headers.get("x-request-id");
  console.log("Public GET /api/metrics:", metricsRes.status, "x-request-id:", reqId);
  if (metricsRes.status !== 200 || !reqId) {
    throw new Error(`Expected 200 OK with x-request-id on /api/metrics, got ${metricsRes.status}`);
  }

  console.log("✅ All HTTP API Security tests passed!");

  console.log("=== Launching Browser to verify Layout Guards & Capture Screenshots at 360 and 1280 px ===");
  const browser = await chromium.launch({ headless: true });

  const testRoutes = [
    { url: "/authority/dashboard", name: "authority_guard_redirect", expectUrl: "/login" },
    { url: "/citizen/dashboard", name: "citizen_guard_redirect", expectUrl: "/login" },
    { url: "/", name: "landing_page", expectUrl: "/" },
    { url: "/login", name: "login_page", expectUrl: "/login" },
  ];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    for (const route of testRoutes) {
      console.log(`Testing ${route.url} at ${vp.width}px...`);
      await page.goto(`http://localhost:3000${route.url}`);
      await page.waitForURL(`**${route.expectUrl}*`, { timeout: 15000 });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      console.log(`Verified URL for ${route.url}: ${currentUrl}`);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (overflow) {
        console.warn(`⚠️ Horizontal overflow detected on ${route.url} at ${vp.width}px!`);
      }

      // Check axe accessibility
      const axeResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .disableRules(["color-contrast"])
        .analyze();

      const violations = axeResults.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      console.log(`Axe serious/critical violations: ${violations.length}`);

      const screenshotPath = path.join(ARTIFACT_DIR, `${route.name}_${vp.width}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`Saved screenshot: ${screenshotPath}`);
    }

    await context.close();
  }

  await browser.close();
  console.log("🎉 Block 1 Verification Complete!");
}

verifyBlock1().catch((err) => {
  console.error("Block 1 Verification failed:", err);
  process.exit(1);
});
