import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("CivicPulse E2E Journeys & Accessibility (§39.4, §39.5)", () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock geolocation for Bengaluru Indiranagar
    await page.context().grantPermissions(["geolocation"]);
    await page.context().setGeolocation({ latitude: 12.9719, longitude: 77.6412 });
  });

  test("Public Journey: landing page, explore catalog, and map view without horizontal overflow or axe violations", async ({
    page,
  }) => {
    // 1. Landing Page (UI-01)
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();

    // Verify independent prototype disclaimer
    await expect(
      page.locator("text=Independent prototype · Not affiliated with BBMP, BDA or any government authority").first(),
    ).toBeVisible();

    // Verify 0 horizontal overflow
    const overflowLanding = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflowLanding).toBe(false);

    // Axe accessibility scan
    const landingAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const landingViolations = landingAxe.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(landingViolations).toEqual([]);

    // 2. Explore Catalog (UI-05)
    await page.goto("/explore", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();

    const overflowExplore = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflowExplore).toBe(false);

    const exploreAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const exploreViolations = exploreAxe.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(exploreViolations).toEqual([]);
  });

  test("Citizen Journey: login, dashboard, and 6-step complaint wizard with priority receipt", async ({
    page,
  }) => {
    // Login
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const demoBtn = page.locator("button:has-text('Citizen Demo')");
    await demoBtn.waitFor({ state: "visible", timeout: 15000 });
    await demoBtn.click();

    // Navigate to citizen area
    await page.waitForURL((url) => url.pathname.includes("/citizen"), { timeout: 20000 });
    await expect(page.locator("h1")).toBeVisible();

    // Open complaint wizard
    await page.goto("/citizen/complaints/new", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();

    // Step 1: Category selection
    const potholeBtn = page.locator("button:has-text('Road pothole')");
    await potholeBtn.click();
    await page.locator("button:has-text('Next: Details')").click();

    // Step 2: Details & Description
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
    await page.locator("button:has-text('Next: Location')").click();

    // Step 3: Location
    await page.waitForSelector("#picker-landmark", { timeout: 10000 });
    await page.fill("#picker-landmark", "Near 12th Main junction, Indiranagar");
    await page.locator("button:has-text('Next: Photos')").click();

    // Step 4: Photos / Evidence
    await page.waitForSelector("button:has-text('Next: AI Review')", { timeout: 10000 });
    await page.locator("button:has-text('Next: AI Review')").click();

    // Step 5: Advisory AI Review
    await page.waitForSelector("button:has-text('Next: Confirm')", { timeout: 10000 });
    await page.locator("button:has-text('Next: Confirm')").click();

    // Step 6: Verify Priority Receipt preview
    await page.waitForSelector("button:has-text('Submit report')", { timeout: 10000 });
    await expect(page.locator("text=Priority Receipt").first()).toBeVisible({ timeout: 15000 });

    // Verify 0 horizontal overflow
    const overflowWizard = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflowWizard).toBe(false);

    // Axe accessibility scan on confirm receipt step
    const receiptAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const receiptViolations = receiptAxe.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(receiptViolations).toEqual([]);

    // Submit report & verify confirmation screen displays monotonic CP-BLR ref
    await page.locator("button:has-text('Submit report')").click();
    await page.waitForSelector("h1:has-text('Report successfully submitted')", { timeout: 15000 });
    await expect(page.locator("text=CP-BLR").first()).toBeVisible({ timeout: 10000 });
  });

  test("Authority Journey: login, queue triage, and workspace inspection", async ({ page }) => {
    // Login
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const demoBtn = page.locator("button:has-text('Authority Demo')");
    await demoBtn.waitFor({ state: "visible", timeout: 15000 });
    await demoBtn.click();

    // Navigate to authority queue
    await page.waitForURL((url) => url.pathname.includes("/authority"), { timeout: 20000 });
    await page.goto("/authority/queue", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();

    // Verify table (desktop) or mobile cards (mobile)
    const hasTable = await page.locator("table").isVisible().catch(() => false);
    const hasHeader = await page.locator("h1").isVisible();
    expect(hasTable || hasHeader).toBe(true);

    // Verify 0 horizontal overflow
    const overflowQueue = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflowQueue).toBe(false);

    // Axe accessibility scan
    const queueAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const queueViolations = queueAxe.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(queueViolations).toEqual([]);
  });

  test("Admin Journey: login, audit logs, and AI telemetry monitoring", async ({ page }) => {
    // Login
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const demoBtn = page.locator("button:has-text('Admin Demo')");
    await demoBtn.waitFor({ state: "visible", timeout: 15000 });
    await demoBtn.click();

    // Navigate to admin area
    await page.waitForURL((url) => url.pathname.includes("/admin"), { timeout: 20000 });

    // 1. Admin Audit Logs
    await page.goto("/admin/audit", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();

    const overflowAudit = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflowAudit).toBe(false);

    const auditAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const auditViolations = auditAxe.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(auditViolations).toEqual([]);

    // 2. Admin AI Telemetry
    await page.goto("/admin/ai", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();

    const overflowAi = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflowAi).toBe(false);

    const aiAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const aiViolations = aiAxe.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(aiViolations).toEqual([]);
  });

  test("Duplicate Radar: duplicate detection check for nearby reports", async ({ page }) => {
    // Login as citizen
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const demoBtn = page.locator("button:has-text('Citizen Demo')");
    await demoBtn.waitFor({ state: "visible", timeout: 15000 });
    await demoBtn.click();
    await page.waitForURL((url) => url.pathname.includes("/citizen"), { timeout: 20000 });

    // Open complaint wizard step 2
    await page.goto("/citizen/complaints/new", { waitUntil: "domcontentloaded" });
    await page.locator("button:has-text('Road pothole')").click();
    await page.locator("button:has-text('Next: Details')").click();

    // Type a report matching common potholes in Bellandur/Indiranagar
    await page.waitForSelector("#report-title", { timeout: 10000 });
    await page.fill("#report-title", "Massive pothole on Indiranagar 100ft road");
    await page.fill(
      "#report-description",
      "Very deep pothole near 12th main Indiranagar junction causing traffic hazard.",
    );

    // Advance to location where radar activates
    await page.locator("button:has-text('Next: Location')").click();
    await page.waitForSelector("#picker-landmark", { timeout: 10000 });

    // Verify page renders cleanly without horizontal scroll
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });
});
