import { test, expect, type Page } from "@playwright/test";

async function safeGoto(page: Page, path: string) {
  try {
    return await page.goto(path, { waitUntil: "domcontentloaded" });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("net::ERR_ABORTED")) {
      return null;
    }
    throw err;
  }
}

test.describe("Full Internal Link Crawler & Zero-404 Verification (PRD UI-14..22)", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(90000);

  test("Crawl public pages and assert zero 404s on all discovered links", async ({ page }) => {
    const visited = new Set<string>();
    const toVisit: string[] = ["/", "/explore", "/explore/map", "/about", "/login", "/register", "/forgot-password"];
    let detailCount = 0;

    while (toVisit.length > 0) {
      const path = toVisit.shift()!;
      if (visited.has(path)) continue;
      visited.add(path);

      const res = await safeGoto(page, path);
      if (res) {
        expect(res.status(), `Expected path ${path} not to return error status`).toBeLessThan(400);
      }

      const notFoundHeading = await page.locator("h1:has-text('Page not found')").count();
      expect(notFoundHeading, `Page at ${path} should not be 404`).toBe(0);

      // Collect links from the page
      const hrefs: string[] = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a[href]"))
          .map((a) => a.getAttribute("href"))
          .filter((href): href is string => {
            if (!href) return false;
            if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) return false;
            if (href.startsWith("#")) return false;
            return href.startsWith("/");
          });
      });

      for (const href of hrefs) {
        const cleanHref = href.split("?")[0]?.split("#")[0] || "";
        if (!cleanHref) continue;

        // Skip non-public links in public crawl
        if (
          cleanHref.startsWith("/citizen") ||
          cleanHref.startsWith("/authority") ||
          cleanHref.startsWith("/admin") ||
          cleanHref.startsWith("/api")
        ) {
          continue;
        }

        // Limit complaint detail crawls to 3 samples to avoid timeout
        if (cleanHref.startsWith("/complaints/")) {
          if (detailCount >= 3) continue;
          detailCount++;
        }

        if (!visited.has(cleanHref) && !toVisit.includes(cleanHref)) {
          toVisit.push(cleanHref);
        }
      }
    }
  });

  test("Crawl Citizen Workspace and assert zero 404s on all internal links", async ({ page }) => {
    // 1. Sign in as citizen
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const demoBtn = page.locator("button:has-text('Citizen Demo')");
    await demoBtn.waitFor({ state: "visible", timeout: 15000 });
    await demoBtn.click();
    await page.waitForURL((url) => url.pathname.includes("/citizen"), { timeout: 25000 });

    const citizenSeeds = [
      "/citizen/dashboard",
      "/citizen/complaints",
      "/citizen/complaints/new",
      "/citizen/notifications",
      "/citizen/profile",
      "/citizen/settings",
    ];

    const visited = new Set<string>();
    const toVisit: string[] = [...citizenSeeds];
    let detailCount = 0;

    while (toVisit.length > 0) {
      const current = toVisit.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const res = await safeGoto(page, current);
      if (res) {
        expect(res.status(), `Expected ${current} not to error`).toBeLessThan(400);
      }

      const notFoundCount = await page.locator("h1:has-text('Page not found')").count();
      expect(notFoundCount, `Path ${current} should not render 404`).toBe(0);

      // Gather links
      const hrefs: string[] = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a[href]"))
          .map((a) => a.getAttribute("href"))
          .filter((href): href is string => {
            if (!href) return false;
            if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) return false;
            return href.startsWith("/citizen") || href.startsWith("/explore") || href === "/";
          });
      });

      for (const href of hrefs) {
        const cleanHref = href.split("?")[0]?.split("#")[0] || "";
        if (!cleanHref) continue;

        if (cleanHref.includes("/complaints/")) {
          if (detailCount >= 3) continue;
          detailCount++;
        }

        if (!visited.has(cleanHref) && !toVisit.includes(cleanHref)) {
          toVisit.push(cleanHref);
        }
      }
    }
  });

  test("Crawl Authority Workspace and assert zero 404s on all internal links", async ({ page }) => {
    // 1. Sign in as authority
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const demoBtn = page.locator("button:has-text('Roads Authority Demo')");
    await demoBtn.waitFor({ state: "visible", timeout: 15000 });
    await demoBtn.click();
    await page.waitForURL((url) => url.pathname.includes("/authority"), { timeout: 25000 });

    const authoritySeeds = [
      "/authority/dashboard",
      "/authority/queue",
      "/authority/complaints",
      "/authority/map",
      "/authority/analytics",
      "/authority/notifications",
      "/authority/profile",
    ];

    const visited = new Set<string>();
    const toVisit: string[] = [...authoritySeeds];
    let detailCount = 0;

    while (toVisit.length > 0) {
      const current = toVisit.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const res = await safeGoto(page, current);
      if (res) {
        expect(res.status(), `Expected ${current} not to error`).toBeLessThan(400);
      }

      const notFoundCount = await page.locator("h1:has-text('Page not found')").count();
      expect(notFoundCount, `Path ${current} should not render 404`).toBe(0);

      const hrefs: string[] = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a[href]"))
          .map((a) => a.getAttribute("href"))
          .filter((href): href is string => {
            if (!href) return false;
            if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) return false;
            return href.startsWith("/authority");
          });
      });

      for (const href of hrefs) {
        const cleanHref = href.split("?")[0]?.split("#")[0] || "";
        if (!cleanHref) continue;

        if (cleanHref.includes("/complaints/")) {
          if (detailCount >= 3) continue;
          detailCount++;
        }

        if (!visited.has(cleanHref) && !toVisit.includes(cleanHref)) {
          toVisit.push(cleanHref);
        }
      }
    }
  });

  test("Crawl Admin Governance Workspace and assert zero 404s on all internal links", async ({ page }) => {
    // 1. Sign in as admin
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.locator("button:has-text('Citizen Demo')").waitFor({ state: "visible", timeout: 15000 });
    await page.fill("input[type='email']", "admin@demo.civicpulse.invalid");
    await page.fill(
      "input[type='password']",
      process.env.DEMO_ADMIN_PASSWORD || "CivicPulseDemo2026!",
    );
    await page.click("button[type='submit']");
    await page.waitForURL((url) => url.pathname.includes("/admin"), { timeout: 25000 });

    const adminSeeds = [
      "/admin/dashboard",
      "/admin/users",
      "/admin/departments",
      "/admin/complaints",
      "/admin/analytics",
      "/admin/ai-monitoring",
      "/admin/audit-logs",
      "/admin/notifications",
      "/admin/settings",
    ];

    const visited = new Set<string>();
    const toVisit: string[] = [...adminSeeds];
    let detailCount = 0;

    while (toVisit.length > 0) {
      const current = toVisit.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const res = await safeGoto(page, current);
      if (res) {
        expect(res.status(), `Expected ${current} not to error`).toBeLessThan(400);
      }

      const notFoundCount = await page.locator("h1:has-text('Page not found')").count();
      expect(notFoundCount, `Path ${current} should not render 404`).toBe(0);

      const hrefs: string[] = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("a[href]"))
          .map((a) => a.getAttribute("href"))
          .filter((href): href is string => {
            if (!href) return false;
            if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) return false;
            return href.startsWith("/admin");
          });
      });

      for (const href of hrefs) {
        const cleanHref = href.split("?")[0]?.split("#")[0] || "";
        if (!cleanHref) continue;

        if (cleanHref.includes("/complaints/")) {
          if (detailCount >= 3) continue;
          detailCount++;
        }

        if (!visited.has(cleanHref) && !toVisit.includes(cleanHref)) {
          toVisit.push(cleanHref);
        }
      }
    }
  });
});
