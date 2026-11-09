import { chromium } from "playwright";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

async function measure() {
  console.log(`Running performance & Core Web Vitals audit against ${BASE_URL} (Mobile 360x780)...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 360, height: 780 },
    userAgent: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  // Evaluate performance metrics via Navigation Timing and PerformanceObserver
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });

  const metrics = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let lcp = 0;
      let cls = 0;

      // LCP observer
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            const lastEntry = entries[entries.length - 1];
            lcp = lastEntry.startTime;
          }
        });
        lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      } catch {}

      // CLS observer
      try {
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }
        });
        clsObserver.observe({ type: "layout-shift", buffered: true });
      } catch {}

      setTimeout(() => {
        const nav = performance.getEntriesByType("navigation")[0] || {};
        const paint = performance.getEntriesByType("paint");
        const fcp = paint.find((p) => p.name === "first-contentful-paint")?.startTime || 0;

        resolve({
          ttfb: nav.responseStart - nav.requestStart || 0,
          domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime || 0,
          fcp,
          lcp: lcp || fcp,
          cls,
        });
      }, 1500);
    });
  });

  await browser.close();

  console.log("\n==========================================");
  console.log("Core Web Vitals & Mobile Performance Audit");
  console.log("==========================================");
  console.log(`• TTFB (Time to First Byte):           ${metrics.ttfb.toFixed(1)} ms`);
  console.log(`• First Contentful Paint (FCP):        ${metrics.fcp.toFixed(1)} ms`);
  console.log(`• Largest Contentful Paint (LCP):      ${metrics.lcp.toFixed(1)} ms (Threshold: < 2500 ms)`);
  console.log(`• Cumulative Layout Shift (CLS):       ${metrics.cls.toFixed(4)} (Threshold: < 0.1)`);
  console.log("==========================================");

  const lcpPass = metrics.lcp < 2500;
  const clsPass = metrics.cls < 0.1;

  if (lcpPass && clsPass) {
    console.log("✅ Core Web Vitals Quality Gate PASSED (LCP < 2.5s, CLS < 0.1)");
  } else {
    console.warn("⚠️ Core Web Vitals Quality Gate WARN");
  }
}

measure().catch((err) => {
  console.error(err);
  process.exit(1);
});

