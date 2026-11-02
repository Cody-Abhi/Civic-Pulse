import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import type { NextRequest } from "next/server";
import nextConfig from "@/../next.config";
import { proxyMiddleware } from "@/middleware/proxy";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import manifest from "@/app/manifest";
import NotFoundPage from "@/app/not-found";

describe("Milestone 8 (R8): System Pages, Headers, Metadata, and Proxy (PRD-§36.3, PRD-UI-32)", () => {
  describe("1. Security Headers Configuration (PRD-§36.3)", () => {
    it("next.config.ts defines headers function", () => {
      expect(nextConfig.headers).toBeDefined();
      expect(typeof nextConfig.headers).toBe("function");
    });

    it("includes CSP, HSTS, nosniff, Referrer-Policy, and Permissions-Policy", async () => {
      const headersConfig = await nextConfig.headers!();
      expect(Array.isArray(headersConfig)).toBe(true);

      const rootRoute = headersConfig.find((h: { source: string }) => h.source === "/:path*");
      expect(rootRoute).toBeDefined();

      const headerMap = new Map(rootRoute!.headers.map((h: { key: string; value: string }) => [h.key, h.value]));

      expect(headerMap.has("Content-Security-Policy")).toBe(true);
      expect(headerMap.get("Content-Security-Policy")).toContain("default-src 'self'");
      expect(headerMap.get("Strict-Transport-Security")).toContain("max-age=63072000");
      expect(headerMap.get("X-Content-Type-Options")).toBe("nosniff");
      expect(headerMap.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      expect(headerMap.get("Permissions-Policy")).toContain("geolocation=(self)");
      expect(headerMap.get("X-Frame-Options")).toBe("DENY");
    });
  });

  describe("2. System Error & Loading Pages in Route Groups", () => {
    const routeGroups = ["(admin)", "(authority)", "(auth)", "(dashboard)", "(public)"];

    it("every route group has an error.tsx error boundary", () => {
      for (const group of routeGroups) {
        const errorPath = path.resolve(process.cwd(), `src/app/${group}/error.tsx`);
        expect(fs.existsSync(errorPath), `Missing error.tsx in ${group}`).toBe(true);
      }
    });

    it("every route group has a loading.tsx skeleton", () => {
      for (const group of routeGroups) {
        const loadingPath = path.resolve(process.cwd(), `src/app/${group}/loading.tsx`);
        expect(fs.existsSync(loadingPath), `Missing loading.tsx in ${group}`).toBe(true);
      }
    });

    it("src/app/not-found.tsx and src/app/global-error.tsx exist", () => {
      expect(fs.existsSync(path.resolve(process.cwd(), "src/app/not-found.tsx"))).toBe(true);
      expect(fs.existsSync(path.resolve(process.cwd(), "src/app/global-error.tsx"))).toBe(true);
      expect(typeof NotFoundPage).toBe("function");
    });
  });

  describe("3. Metadata Helpers (robots, sitemap, manifest)", () => {
    it("robots.ts returns valid rules and sitemap", () => {
      const rob = robots();
      expect(rob.sitemap).toBeDefined();
      expect(rob.rules).toBeDefined();
    });

    it("sitemap.ts returns public routes array", () => {
      const sm = sitemap();
      expect(Array.isArray(sm)).toBe(true);
      expect(sm.length).toBeGreaterThan(0);
      const urls = sm.map((s) => s.url);
      expect(urls.some((u) => u.endsWith("/explore"))).toBe(true);
      expect(urls.some((u) => u.includes("/admin"))).toBe(false);
    });

    it("manifest.ts returns web manifest with branding colors", () => {
      const mf = manifest();
      expect(mf.name).toBe("CivicPulse AI — Transparent Civic Action");
      expect(mf.start_url).toBe("/");
      expect(mf.theme_color).toBe("#0F766E");
    });
  });

  describe("4. Proxy / Middleware Authentication Redirection", () => {
    it("redirects unauthenticated protected routes to /login?next=...", () => {
      const mockReq = {
        url: "http://localhost:3000/citizen/dashboard",
        nextUrl: new URL("http://localhost:3000/citizen/dashboard"),
        cookies: {
          get: () => undefined,
        },
      } as unknown as NextRequest;

      const res = proxyMiddleware(mockReq);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain("next=%2Fcitizen%2Fdashboard");
    });

    it("allows request when valid session cookie exists", () => {
      const mockReq = {
        url: "http://localhost:3000/citizen/dashboard",
        nextUrl: new URL("http://localhost:3000/citizen/dashboard"),
        cookies: {
          get: (name: string) => (name === "__session" ? { value: "valid-session-jwt" } : undefined),
        },
      } as unknown as NextRequest;

      const res = proxyMiddleware(mockReq);
      expect(res.status).toBe(200);
    });
  });
});

