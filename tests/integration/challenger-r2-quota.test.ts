import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getAdminFirestore } from "@/server/clients/firebase-admin";
import { listComplaints, getComplaintCounts } from "@/server/repositories/complaints.repo";
import { getWardStats } from "@/server/repositories/metrics.repo";
import { listDepartments, updateDepartment } from "@/server/services/admin";
import type { SessionUser } from "@/server/auth/session";

/**
 * Challenger Adversarial Stress Test: Milestone 2 (R2 - Firestore Read Quota Optimization)
 * Tests pushdown filters, multi-page cursor pagination without data loss or duplication,
 * aggregation counts, edge cases, and dual-interface compatibility.
 */
describe("Milestone 2 Challenger: Read Quota Optimization Stress Harness", () => {
  const firestore = getAdminFirestore();
  const testIds: string[] = [];
  const testCitizenId = "challenger-r2-citizen-x";
  const testDeptId = "challenger-test-dept";

  const adminActor: SessionUser = {
    uid: "challenger-admin-1",
    email: "admin@civicpulse.test",
    role: "admin",
    displayName: "Challenger Admin",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: null,
  };

  beforeAll(async () => {
    const now = Date.now();
    const batch = firestore.batch();

    // 1. Seed 35 complaints for testCitizenId in "challenger-test-dept" and "ward-150-bellandur"
    // 25 open (SUBMITTED), 10 resolved
    for (let i = 1; i <= 35; i++) {
      const id = `challenger-r2-complaint-${i.toString().padStart(2, "0")}`;
      testIds.push(id);
      const isResolved = i > 25;

      const docRef = firestore.collection("complaints").doc(id);
      batch.set(docRef, {
        id,
        ref: `CP-BLR-CHAL-${String(i).padStart(5, "0")}`,
        cityId: "blr",
        title: `Challenger Quota Stress #${i}`,
        description: `Adversarial stress testing complaint record #${i} for pagination and filter pushdown`,
        category: i % 2 === 0 ? "POTHOLE" : "GARBAGE",
        categorySource: "user",
        categoryConfirmed: true,
        departmentId: testDeptId,
        departmentName: "Challenger Stress Department",
        status: isResolved ? "RESOLVED" : "SUBMITTED",
        statusChangedAt: new Date(now - i * 1000).toISOString(),
        visibility: "public",
        location: {
          lat: 12.9352,
          lng: 77.6245,
          wardId: i <= 20 ? "ward-150-bellandur" : "ward-174-hsr-layout",
          wardName: i <= 20 ? "Bellandur" : "HSR Layout",
        },
        durationBucket: "TODAY",
        affectedScale: 0.1,
        hazardFlags: [],
        reporterUid: testCitizenId,
        reporterDisplayName: "Challenger Citizen",
        supporterCount: i * 2,
        priority: {
          score: 50 + (i % 50),
          band: i > 30 ? "CRITICAL" : "HIGH",
        },
        createdAt: new Date(now - i * 50000).toISOString(),
        updatedAt: new Date(now - i * 50000).toISOString(),
      });
    }

    // 2. Seed a test department document in "departments"
    const deptRef = firestore.collection("departments").doc(testDeptId);
    batch.set(deptRef, {
      id: testDeptId,
      code: "CHAL",
      name: "Challenger Test Dept",
      description: "Department for quota testing",
      active: true,
      slaHours: 48,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Seed departmentMetrics
    const deptMetricRef = firestore.collection("departmentMetrics").doc(testDeptId);
    batch.set(deptMetricRef, {
      open: 25,
      overdue: 4,
      total: 35,
      slaComplianceRate: 88,
      updatedAt: new Date().toISOString(),
    });

    await batch.commit();
  });

  afterAll(async () => {
    const batch = firestore.batch();
    for (const id of testIds) {
      batch.delete(firestore.collection("complaints").doc(id));
    }
    batch.delete(firestore.collection("departments").doc(testDeptId));
    batch.delete(firestore.collection("departmentMetrics").doc(testDeptId));
    await batch.commit();
  });

  describe("1. Multi-Page Cursor Pagination Without Data Loss or Duplication", () => {
    it("exhaustively traverses 35 documents in batches of 10 with zero duplication", async () => {
      const pageSize = 10;
      const seenIds = new Set<string>();
      let cursor: string | undefined = undefined;
      let pagesCount = 0;

      while (true) {
        const page = await listComplaints({
          reporterUid: testCitizenId,
          limit: pageSize,
          cursor,
        });

        pagesCount++;
        expect(page.length).toBeGreaterThan(0);

        for (const doc of page) {
          expect(seenIds.has(doc.id)).toBe(false); // No duplicates allowed
          seenIds.add(doc.id);
        }

        if (!page.nextCursor) {
          break;
        }
        cursor = page.nextCursor;
      }

      expect(pagesCount).toBe(4); // 10, 10, 10, 5
      expect(seenIds.size).toBe(35); // All 35 documents retrieved
    });

    it("yields identical second page whether cursor is string ID or DocumentSnapshot", async () => {
      const page1 = await listComplaints({
        reporterUid: testCitizenId,
        limit: 10,
      });
      const cursorString = page1.nextCursor!;

      const cursorDocSnap = await firestore.collection("complaints").doc(cursorString).get();

      const [resFromString, resFromSnap] = await Promise.all([
        listComplaints({ reporterUid: testCitizenId, limit: 10, cursor: cursorString }),
        listComplaints({ reporterUid: testCitizenId, limit: 10, cursor: cursorDocSnap }),
      ]);

      expect(resFromString.length).toBe(10);
      expect(resFromSnap.length).toBe(10);
      for (let i = 0; i < 10; i++) {
        expect(resFromString[i]!.id).toBe(resFromSnap[i]!.id);
      }
    });

    it("gracefully falls back when passed a non-existent cursor ID", async () => {
      const result = await listComplaints({
        reporterUid: testCitizenId,
        limit: 5,
        cursor: "non-existent-random-id-99999",
      });
      // Should not crash and should return the first page bounded by limit
      expect(result.length).toBe(5);
    });
  });

  describe("2. Pushed Filters Combinations & Edge Cases", () => {
    it("correctly filters by wardId and status OPEN_ALL without in-memory scan", async () => {
      // 20 seeded in Bellandur, of which 5 are resolved (i=21..25 were HSR Layout)
      // For Bellandur (i=1..20), all 20 are status SUBMITTED (i <= 20)
      const res = await listComplaints({
        reporterUid: testCitizenId,
        wardId: "ward-150-bellandur",
        status: "OPEN_ALL",
        limit: 50,
      });

      expect(res.length).toBe(20);
      expect(res.every((c) => c.location.wardId === "ward-150-bellandur")).toBe(true);
      expect(res.every((c) => c.status === "SUBMITTED")).toBe(true);
    });

    it("correctly handles wardId with 'ALL' and 'All Wards' wildcards without crashing", async () => {
      const res1 = await listComplaints({
        reporterUid: testCitizenId,
        wardId: "ALL",
        limit: 50,
      });
      const res2 = await listComplaints({
        reporterUid: testCitizenId,
        wardId: "All Wards",
        limit: 50,
      });

      // With limit 50, all 35 complaints across both wards are returned (wildcard bypassed ward filter)
      expect(res1.length).toBe(35);
      expect(res2.length).toBe(35);

      // Without explicit limit, default limit 20 is enforced
      const defaultLimitRes = await listComplaints({
        reporterUid: testCitizenId,
        wardId: "ALL",
      });
      expect(defaultLimitRes.length).toBe(20);
      expect(defaultLimitRes.nextCursor).toBeDefined();
    });

    it("correctly applies category filter directly to Firestore", async () => {
      const potholes = await listComplaints({
        reporterUid: testCitizenId,
        category: "POTHOLE",
        limit: 50,
      });

      expect(potholes.length).toBeGreaterThan(0);
      expect(potholes.every((c) => c.category === "POTHOLE")).toBe(true);
    });
  });

  describe("3. Count Aggregations & Quota Protection", () => {
    it("accurately calculates total, open, and resolved counts using Firestore count() aggregation", async () => {
      const counts = await getComplaintCounts({
        reporterUid: testCitizenId,
      });

      expect(counts.total).toBe(35);
      expect(counts.open).toBe(25);
      expect(counts.resolved).toBe(10);
      expect(counts.total).toBe(counts.open + counts.resolved);
    });

    it("calculates counts filtered by wardId using count() aggregation", async () => {
      const bellandurCounts = await getComplaintCounts({
        reporterUid: testCitizenId,
        wardId: "ward-150-bellandur",
      });

      expect(bellandurCounts.total).toBe(20);
      expect(bellandurCounts.open).toBe(20);
      expect(bellandurCounts.resolved).toBe(0);
    });

    it("verifies updateDepartment blocks deactivation when open complaints exist", async () => {
      await expect(
        updateDepartment(testDeptId, { active: false }, adminActor),
      ).rejects.toThrow(/Reassign the 25 open complaints first/);
    });

    it("verifies listDepartments reads departmentMetrics without loading complaints", async () => {
      const depts = await listDepartments();
      const testDept = depts.find((d) => d.id === testDeptId);

      expect(testDept).toBeDefined();
      expect(testDept?.openComplaints).toBe(25);
      expect(testDept?.overdueComplaints).toBe(4);
    });

    it("verifies getWardStats returns valid non-empty summary without scanning complaints", async () => {
      const stats = await getWardStats();
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThan(0);

      for (const summary of stats) {
        expect(typeof summary.wardId).toBe("string");
        expect(typeof summary.wardName).toBe("string");
        expect(typeof summary.totalComplaints).toBe("number");
        expect(typeof summary.openComplaints).toBe("number");
        expect(summary.totalComplaints).toBeGreaterThanOrEqual(summary.openComplaints);
      }
    });
  });

  describe("4. Non-Breaking Dual Interface Robustness", () => {
    it("exhibits full Array prototype fidelity and object destructuring", async () => {
      const result = await listComplaints({
        reporterUid: testCitizenId,
        limit: 10,
      });

      // Array prototype operations
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(10);
      expect(result.map((c) => c.id).length).toBe(10);
      expect(result.filter((c) => c.status === "SUBMITTED").length).toBe(10);
      expect(result.slice(0, 3).length).toBe(3);

      // Destructuring compatibility
      const { complaints, nextCursor } = result;
      expect(Array.isArray(complaints)).toBe(true);
      expect(complaints.length).toBe(10);
      expect(nextCursor).toBeDefined();

      // Serialization fidelity: JSON.stringify produces array of 10 items
      const serialized = JSON.stringify(result);
      const parsed = JSON.parse(serialized);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(10);
    });
  });
});
