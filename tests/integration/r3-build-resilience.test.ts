import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as PageModule from "@/app/page";
import HomePage from "@/app/page";
import * as metricsRepo from "@/server/repositories/metrics.repo";
import {
  DEFAULT_CITY_METRICS,
  getDefaultWardStats,
  getCityMetrics,
  getWardStats,
  getDepartmentMetrics,
} from "@/server/repositories/metrics.repo";
import * as firebaseAdmin from "@/server/clients/firebase-admin";

describe("Milestone 3 (R3): Build Resilience and Dynamic Revalidation (PRD-§36.1, PRD-UI-01)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Landing Page Route Segment Configuration (§UI-01, §36.1)", () => {
    it("exports revalidate = 300 for 5-minute Incremental Static Regeneration (ISR)", () => {
      expect(PageModule.revalidate).toBe(300);
      expect(typeof PageModule.revalidate).toBe("number");
    });

    it("exports valid metadata with title and description", () => {
      expect(PageModule.metadata).toBeDefined();
      expect(PageModule.metadata.title).toBe("AI-Powered Civic Action Platform");
      expect(PageModule.metadata.description).toBeDefined();
    });
  });

  describe("2. Canonical Default Metrics Constants & Helpers", () => {
    it("DEFAULT_CITY_METRICS exports clean zeroed counters and empty dictionary objects", () => {
      expect(DEFAULT_CITY_METRICS).toBeDefined();
      expect(DEFAULT_CITY_METRICS.totalComplaints).toBe(0);
      expect(DEFAULT_CITY_METRICS.resolvedComplaints).toBe(0);
      expect(DEFAULT_CITY_METRICS.inProgressComplaints).toBe(0);
      expect(DEFAULT_CITY_METRICS.submittedComplaints).toBe(0);
      expect(DEFAULT_CITY_METRICS.criticalComplaints).toBe(0);
      expect(DEFAULT_CITY_METRICS.resolutionRate).toBe(0);
      expect(DEFAULT_CITY_METRICS.avgResolutionHours).toBe(0);
      expect(DEFAULT_CITY_METRICS.activeCitizens).toBe(0);
      expect(DEFAULT_CITY_METRICS.open).toBe(0);

      // Defensively defined dictionary objects
      expect(DEFAULT_CITY_METRICS.openByBand).toEqual({});
      expect(DEFAULT_CITY_METRICS.openByDepartment).toEqual({});
      expect(DEFAULT_CITY_METRICS.openByCategory).toEqual({});
      expect(DEFAULT_CITY_METRICS.openByWard).toEqual({});
      expect(DEFAULT_CITY_METRICS.isSynthetic).toBe(false);
      expect(DEFAULT_CITY_METRICS.updatedAt).toBeDefined();
    });

    it("getDefaultWardStats returns pilot wards with zeroed counts", () => {
      const defaultWards = getDefaultWardStats();
      expect(Array.isArray(defaultWards)).toBe(true);
      expect(defaultWards.length).toBeGreaterThanOrEqual(8);

      for (const ward of defaultWards) {
        expect(ward.wardId).toBeDefined();
        expect(ward.wardName).toBeDefined();
        expect(ward.totalComplaints).toBe(0);
        expect(ward.openComplaints).toBe(0);
        expect(ward.resolvedComplaints).toBe(0);
        expect(ward.overdueComplaints).toBe(0);
      }
    });
  });

  describe("3. Repository Offline & Failure Resilience", () => {
    it("getCityMetrics returns DEFAULT_CITY_METRICS when getAdminFirestore throws synchronously", async () => {
      vi.spyOn(firebaseAdmin, "getAdminFirestore").mockImplementation(() => {
        throw new Error("Invalid server environment — missing credentials");
      });

      const metrics = await getCityMetrics();
      expect(metrics).toEqual(DEFAULT_CITY_METRICS);
    });

    it("getCityMetrics returns DEFAULT_CITY_METRICS when Firestore rejects with 14 UNAVAILABLE", async () => {
      const mockDocGet = vi.fn().mockRejectedValue(new Error("14 UNAVAILABLE: No connection established"));
      const mockCollection = vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: mockDocGet,
        }),
      });
      vi.spyOn(firebaseAdmin, "getAdminFirestore").mockReturnValue({
        collection: mockCollection,
      } as unknown as ReturnType<typeof firebaseAdmin.getAdminFirestore>);

      const metrics = await getCityMetrics();
      expect(metrics).toEqual(DEFAULT_CITY_METRICS);
    });

    it("getCityMetrics returns DEFAULT_CITY_METRICS when snap.exists is false", async () => {
      const mockDocGet = vi.fn().mockResolvedValue({
        exists: false,
        data: () => undefined,
      });
      const mockCollection = vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: mockDocGet,
        }),
      });
      vi.spyOn(firebaseAdmin, "getAdminFirestore").mockReturnValue({
        collection: mockCollection,
      } as unknown as ReturnType<typeof firebaseAdmin.getAdminFirestore>);

      const metrics = await getCityMetrics();
      expect(metrics).toEqual(DEFAULT_CITY_METRICS);
    });

    it("getCityMetrics defensively completes missing dictionaries when snap.exists is true but partial", async () => {
      const partialData = {
        totalComplaints: 150,
        resolvedComplaints: 120,
        avgResolutionHours: 18.5,
        // openByDepartment, openByWard, etc. are omitted
      };

      const mockDocGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => partialData,
      });
      const mockCollection = vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: mockDocGet,
        }),
      });
      vi.spyOn(firebaseAdmin, "getAdminFirestore").mockReturnValue({
        collection: mockCollection,
      } as unknown as ReturnType<typeof firebaseAdmin.getAdminFirestore>);

      const metrics = await getCityMetrics();
      expect(metrics.totalComplaints).toBe(150);
      expect(metrics.resolvedComplaints).toBe(120);
      expect(metrics.avgResolutionHours).toBe(18.5);
      // Dictionaries must be defined and fall back to empty objects
      expect(metrics.openByDepartment).toEqual({});
      expect(metrics.openByWard).toEqual({});
      expect(metrics.openByBand).toEqual({});
      expect(metrics.openByCategory).toEqual({});
    });

    it("getWardStats returns default ward summaries without throwing when database fails", async () => {
      vi.spyOn(firebaseAdmin, "getAdminFirestore").mockImplementation(() => {
        throw new Error("ECONNREFUSED 127.0.0.1:8080");
      });

      const wardStats = await getWardStats();
      expect(Array.isArray(wardStats)).toBe(true);
      expect(wardStats.length).toBeGreaterThan(0);
      expect(wardStats).toEqual(getDefaultWardStats());
    });

    it("getDepartmentMetrics returns null without throwing when database fails", async () => {
      vi.spyOn(firebaseAdmin, "getAdminFirestore").mockImplementation(() => {
        throw new Error("DEADLINE_EXCEEDED");
      });

      const dept = await getDepartmentMetrics("roads");
      expect(dept).toBeNull();
    });
  });

  describe("4. HomePage Prerendering Resilience", () => {
    it("HomePage renders without throwing when getCityMetrics succeeds with full metrics", async () => {
      vi.spyOn(metricsRepo, "getCityMetrics").mockResolvedValueOnce({
        ...DEFAULT_CITY_METRICS,
        totalComplaints: 250,
        resolvedComplaints: 180,
        openByDepartment: { ROADS: 128, BESCOM: 42, BWSSB: 76 },
        openByWard: { "ward-150": 94, "ward-174": 88 },
        avgResolutionHours: 22.4,
      });
      const result = await HomePage();
      expect(result).toBeDefined();
      expect(result.type).toBe("div");
    });

    it("HomePage renders without throwing when getCityMetrics rejects/fails", async () => {
      vi.spyOn(metricsRepo, "getCityMetrics").mockRejectedValueOnce(
        new Error("Firestore offline during SSG prerendering")
      );

      const result = await HomePage();
      expect(result).toBeDefined();
      expect(result.type).toBe("div");
    });

    it("HomePage renders without throwing when getCityMetrics returns empty/partial data with undefined dictionaries", async () => {
      vi.spyOn(metricsRepo, "getCityMetrics").mockResolvedValueOnce({
        totalComplaints: 0,
        resolvedComplaints: 0,
        inProgressComplaints: 0,
        submittedComplaints: 0,
        criticalComplaints: 0,
        resolutionRate: 0,
        avgResolutionHours: 0,
        activeCitizens: 0,
        open: 0,
        openByBand: undefined as unknown as Record<string, number>,
        openByDepartment: undefined as unknown as Record<string, number>,
        openByCategory: undefined as unknown as Record<string, number>,
        openByWard: undefined as unknown as Record<string, number>,
        isSynthetic: false,
        updatedAt: "1970-01-01T00:00:00.000Z",
      });

      const result = await HomePage();
      expect(result).toBeDefined();
      expect(result.type).toBe("div");
    });
  });
});
