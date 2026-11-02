import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getAdminFirestore } from "@/server/clients/firebase-admin";
import { listComplaints, getComplaintCounts } from "@/server/repositories/complaints.repo";
import { getCityMetrics, getWardStats } from "@/server/repositories/metrics.repo";

describe("Milestone 2 (R2): Firestore Read Quota Optimization Tests (PRD-§23.4, §23.5)", () => {
  const firestore = getAdminFirestore();
  const testIds: string[] = [];

  const reporterA = "user-r2-test-citizen-a";
  const reporterB = "user-r2-test-citizen-b";

  beforeAll(async () => {
    const now = Date.now();
    const batch = firestore.batch();

    // Seed 25 test complaints for reporter A in "roads" & "ward-150-bellandur"
    // to test default limit(20) and cursor pagination
    for (let i = 1; i <= 25; i++) {
      const id = `r2-test-complaint-a-${i.toString().padStart(2, "0")}`;
      testIds.push(id);
      const isResolved = i > 20; // 20 open (SUBMITTED), 5 resolved

      const docRef = firestore.collection("complaints").doc(id);
      batch.set(docRef, {
        id,
        ref: `CP-BLR-2601-${String(i).padStart(6, "0")}`,
        cityId: "blr",
        title: `R2 Pothole Complaint #${i}`,
        description: `Description for R2 test pothole #${i}`,
        category: "POTHOLE",
        categorySource: "user",
        categoryConfirmed: true,
        departmentId: "roads",
        departmentName: "Roads and Infrastructure",
        status: isResolved ? "RESOLVED" : "SUBMITTED",
        statusChangedAt: new Date(now - i * 1000).toISOString(),
        visibility: "public",
        location: {
          lat: 12.9352,
          lng: 77.6245,
          wardId: "ward-150-bellandur",
          wardName: "Bellandur",
        },
        durationBucket: "TODAY",
        affectedScale: 0.1,
        hazardFlags: [],
        reporterUid: reporterA,
        reporterDisplayName: "Citizen A",
        supporterCount: 25 - i,
        priority: {
          score: 80 - i,
          band: i <= 5 ? "CRITICAL" : "HIGH",
        },
        createdAt: new Date(now - i * 10000).toISOString(),
        updatedAt: new Date(now - i * 10000).toISOString(),
      });
    }

    // Seed 5 complaints for reporter B in "sanitation" & "ward-151-koramangala"
    for (let j = 1; j <= 5; j++) {
      const id = `r2-test-complaint-b-${j}`;
      testIds.push(id);
      const docRef = firestore.collection("complaints").doc(id);
      batch.set(docRef, {
        id,
        ref: `CP-BLR-2601-B${String(j).padStart(5, "0")}`,
        cityId: "blr",
        title: `R2 Sanitation Issue #${j}`,
        description: `Description for sanitation issue #${j}`,
        category: "GARBAGE",
        categorySource: "user",
        categoryConfirmed: true,
        departmentId: "sanitation",
        departmentName: "Solid Waste Management",
        status: "SUBMITTED",
        statusChangedAt: new Date(now).toISOString(),
        visibility: "public",
        location: {
          lat: 12.9352,
          lng: 77.6245,
          wardId: "ward-151-koramangala",
          wardName: "Koramangala",
        },
        durationBucket: "TODAY",
        affectedScale: 0.1,
        hazardFlags: [],
        reporterUid: reporterB,
        reporterDisplayName: "Citizen B",
        supporterCount: 0,
        priority: { score: 40, band: "MEDIUM" },
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),
      });
    }

    await batch.commit();
  });

  afterAll(async () => {
    const batch = firestore.batch();
    for (const id of testIds) {
      batch.delete(firestore.collection("complaints").doc(id));
    }
    await batch.commit();
  });

  describe("Requirement 2.A: Pushed Firestore Filters", () => {
    it("pushes reporterUid filter to Firestore directly", async () => {
      const result = await listComplaints({ reporterUid: reporterB });
      expect(result.length).toBe(5);
      expect(result.every((c) => c.reporterUid === reporterB)).toBe(true);
    });

    it("pushes departmentId filter to Firestore directly", async () => {
      const result = await listComplaints({ departmentId: "sanitation" });
      expect(result.length).toBeGreaterThanOrEqual(5);
      expect(result.every((c) => c.departmentId === "sanitation")).toBe(true);
    });

    it("pushes wardId filter to Firestore directly (location.wardId)", async () => {
      const result = await listComplaints({ wardId: "ward-151-koramangala" });
      expect(result.length).toBeGreaterThanOrEqual(5);
      expect(result.every((c) => c.location.wardId === "ward-151-koramangala")).toBe(true);
    });

    it("pushes status 'OPEN_ALL' using Firestore 'in' operator", async () => {
      const result = await listComplaints({ reporterUid: reporterA, status: "OPEN_ALL" });
      expect(result.length).toBe(20); // exactly 20 open seeded
      expect(result.every((c) => c.status !== "RESOLVED" && c.status !== "CLOSED")).toBe(true);
    });
  });

  describe("Requirement 2.B: Default limit(20) and Cursor Pagination", () => {
    it("respects default limit(20) and returns nextCursor", async () => {
      const page1 = await listComplaints({ reporterUid: reporterA });
      expect(page1.length).toBe(20);
      expect(page1.nextCursor).toBeDefined();
    });

    it("continues pagination from nextCursor with no overlapping records", async () => {
      const page1 = await listComplaints({ reporterUid: reporterA });
      const nextCursor = page1.nextCursor;
      expect(nextCursor).toBeDefined();

      const page2 = await listComplaints({ reporterUid: reporterA, cursor: nextCursor });
      expect(page2.length).toBe(5); // 25 total - 20 = 5 remaining

      const page1Ids = new Set(page1.map((c) => c.id));
      for (const comp of page2) {
        expect(page1Ids.has(comp.id)).toBe(false);
      }
      expect(page2.nextCursor).toBeUndefined(); // < 20 docs left on second page
    });
  });

  describe("Requirement 2.C: Non-Breaking Dual Interface", () => {
    it("supports object destructuring { complaints, nextCursor }", async () => {
      const { complaints, nextCursor } = await listComplaints({ reporterUid: reporterB });
      expect(Array.isArray(complaints)).toBe(true);
      expect(complaints.length).toBe(5);
    });

    it("supports array operations directly on returned result", async () => {
      const result = await listComplaints({ reporterUid: reporterB });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
      expect(typeof result.map).toBe("function");
      expect(typeof result.filter).toBe("function");
    });
  });

  describe("Requirement 2.D: Dashboard Aggregation & Counters", () => {
    it("fetches city metrics from totals counter doc without reading complaints", async () => {
      const metrics = await getCityMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalComplaints).toBe("number");
      expect(typeof metrics.open).toBe("number");
    });

    it("counts open and resolved complaints using getComplaintCounts aggregation", async () => {
      const counts = await getComplaintCounts({ reporterUid: reporterA });
      expect(counts.total).toBe(25);
      expect(counts.open).toBe(20);
      expect(counts.resolved).toBe(5);
    });

    it("counts complaints using direct Firestore count() aggregation", async () => {
      const openSnap = await firestore
        .collection("complaints")
        .where("reporterUid", "==", reporterA)
        .where("status", "==", "SUBMITTED")
        .count()
        .get();

      expect(openSnap.data().count).toBe(20);
    });

    it("getWardStats returns summaries without full collection read", async () => {
      const wardStats = await getWardStats();
      expect(Array.isArray(wardStats)).toBe(true);
      expect(wardStats.length).toBeGreaterThan(0);
      expect(wardStats[0]).toHaveProperty("wardId");
      expect(wardStats[0]).toHaveProperty("openComplaints");
    });
  });
});
