import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getAdminFirestore } from "@/server/clients/firebase-admin";
import { listComplaints, getComplaintCounts } from "@/server/repositories/complaints.repo";
import { OPEN_STATUSES, ComplaintStatus } from "@/domain/schemas";

/**
 * Challenger Adversarial Stress Test: Firestore Read Quota Optimization
 * Milestone 2 (R2: Firestore Read Quota Optimization)
 *
 * Requirements to challenge:
 * 1. Default limit (20): Verify no more than 20 documents are returned when >20 exist.
 * 2. Cursor pagination with .startAfter(): Verify page 2 does not overlap with page 1,
 *    and multi-page traversals contain complete partition without duplication.
 * 3. Filter pushdown: Empirically prove that filters (reporterUid, departmentId, status: "OPEN_ALL")
 *    are pushed down to the database level rather than filtered in-memory post-limit.
 * 4. Dual-interface: Verify destructured { complaints, nextCursor } and direct array access.
 * 5. Boundary & edge conditions: limit=0, limit=1, unknown cursor doc, empty results,
 *    single status filter, statuses array filter, visibility filter, offset fallback.
 */
describe("Milestone 2 Challenger: Firestore Read Quota Optimization Stress Test", () => {
  const firestore = getAdminFirestore();
  const testDocIds: string[] = [];

  const REPORTER_MANY = "challenger-m2-reporter-many";
  const REPORTER_FEW = "challenger-m2-reporter-few";
  const DEPT_PRIMARY = "roads";
  const DEPT_SECONDARY = "challenger-m2-dept-secondary";
  const DEPT_MINORITY = "challenger-m2-dept-minority";
  const WARD_A = "ward-150-bellandur";
  const WARD_B = "ward-151-koramangala";

  beforeAll(async () => {
    const baseTime = Date.now();
    const batch = firestore.batch();

    // 1. Seed 45 complaints for REPORTER_MANY in DEPT_PRIMARY:
    //    - 30 OPEN complaints (SUBMITTED, UNDER_REVIEW, ASSIGNED, IN_PROGRESS, REOPENED)
    //    - 15 non-open complaints: 5 RESOLVED, 5 CLOSED, 5 REJECTED
    for (let i = 1; i <= 45; i++) {
      const id = `challenger-m2-doc-many-${String(i).padStart(3, "0")}`;
      testDocIds.push(id);

      const isOpen = i <= 30;
      let status: ComplaintStatus;
      if (isOpen) {
        const openIdx = (i - 1) % OPEN_STATUSES.length;
        status = OPEN_STATUSES[openIdx]!;
      } else {
        const closedOptions: ComplaintStatus[] = ["RESOLVED", "CLOSED", "REJECTED"];
        status = closedOptions[(i - 1) % closedOptions.length]!;
      }

      const docRef = firestore.collection("complaints").doc(id);
      const timestamp = new Date(baseTime - i * 60000).toISOString();

      batch.set(docRef, {
        id,
        ref: `CP-M2-ADV-${String(i).padStart(4, "0")}`,
        cityId: "blr",
        title: `Challenger Complaint ${i}`,
        description: `Adversarial stress test complaint number ${i} for read quota verification.`,
        category: "POTHOLE",
        categorySource: "user",
        categoryConfirmed: true,
        departmentId: DEPT_PRIMARY,
        departmentName: "Roads & Infrastructure",
        status,
        statusChangedAt: timestamp,
        visibility: i === 45 ? "private" : "public", // 1 private complaint to test visibility filter
        location: {
          lat: 12.9352,
          lng: 77.6245,
          wardId: i % 2 === 0 ? WARD_A : WARD_B,
          wardName: i % 2 === 0 ? "Bellandur" : "Koramangala",
        },
        durationBucket: "FEW_DAYS",
        affectedScale: 0.2,
        hazardFlags: [],
        reporterUid: REPORTER_MANY,
        reporterDisplayName: "Challenger Tester Many",
        supporterCount: 45 - i,
        priority: {
          score: 90 - i,
          band: i <= 10 ? "CRITICAL" : i <= 25 ? "HIGH" : "MEDIUM",
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    // 2. Empirical Pushdown Probe Setup:
    //    Seed 25 documents in DEPT_SECONDARY with NEWER timestamps (createdAt = baseTime + 1000..25000),
    //    and 5 documents in DEPT_MINORITY with OLDER timestamps (createdAt = baseTime - 800000).
    //    If departmentId filter was applied in JS after an un-pushed limit(20), querying DEPT_MINORITY
    //    would fetch the 20 newest docs (DEPT_SECONDARY), discard them all in JS, and return 0 results!
    for (let j = 1; j <= 25; j++) {
      const id = `challenger-m2-probe-dept-sec-${j}`;
      testDocIds.push(id);
      const timestamp = new Date(baseTime + 100000 + j * 1000).toISOString();
      const docRef = firestore.collection("complaints").doc(id);
      batch.set(docRef, {
        id,
        ref: `CP-M2-SEC-${String(j).padStart(3, "0")}`,
        cityId: "blr",
        title: `Secondary Department Issue ${j}`,
        description: `Power outage report #${j}`,
        category: "STREETLIGHT",
        categorySource: "user",
        categoryConfirmed: true,
        departmentId: DEPT_SECONDARY,
        departmentName: "Secondary Department",
        status: "SUBMITTED",
        statusChangedAt: timestamp,
        visibility: "public",
        location: { lat: 12.93, lng: 77.62, wardId: WARD_A, wardName: "Bellandur" },
        durationBucket: "TODAY",
        affectedScale: 0.1,
        hazardFlags: [],
        reporterUid: "challenger-m2-probe-reporter",
        reporterDisplayName: "Probe Reporter",
        supporterCount: 0,
        priority: { score: 50, band: "MEDIUM" },
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    for (let k = 1; k <= 5; k++) {
      const id = `challenger-m2-probe-dept-min-${k}`;
      testDocIds.push(id);
      const timestamp = new Date(baseTime - 800000 - k * 1000).toISOString();
      const docRef = firestore.collection("complaints").doc(id);
      batch.set(docRef, {
        id,
        ref: `CP-M2-MIN-${String(k).padStart(3, "0")}`,
        cityId: "blr",
        title: `Minority Department Issue ${k}`,
        description: `Public health concern #${k}`,
        category: "GARBAGE",
        categorySource: "user",
        categoryConfirmed: true,
        departmentId: DEPT_MINORITY,
        departmentName: "Minority Isolated Department",
        status: "ASSIGNED",
        statusChangedAt: timestamp,
        visibility: "public",
        location: { lat: 12.93, lng: 77.62, wardId: WARD_B, wardName: "Koramangala" },
        durationBucket: "TODAY",
        affectedScale: 0.1,
        hazardFlags: [],
        reporterUid: REPORTER_FEW,
        reporterDisplayName: "Few Reporter",
        supporterCount: 0,
        priority: { score: 40, band: "MEDIUM" },
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    // 3. Empirical Pushdown Probe for status="OPEN_ALL":
    //    Seed 25 RESOLVED documents with NEWER timestamps for REPORTER_FEW,
    //    and 5 ASSIGNED (OPEN) documents with OLDER timestamps for REPORTER_FEW.
    for (let r = 1; r <= 25; r++) {
      const id = `challenger-m2-probe-status-res-${r}`;
      testDocIds.push(id);
      const timestamp = new Date(baseTime + 200000 + r * 1000).toISOString();
      const docRef = firestore.collection("complaints").doc(id);
      batch.set(docRef, {
        id,
        ref: `CP-M2-RES-${String(r).padStart(3, "0")}`,
        cityId: "blr",
        title: `Resolved Issue ${r}`,
        description: `Resolved complaint #${r}`,
        category: "DRAINAGE",
        categorySource: "user",
        categoryConfirmed: true,
        departmentId: DEPT_PRIMARY,
        departmentName: "Roads & Infrastructure",
        status: "RESOLVED",
        statusChangedAt: timestamp,
        visibility: "public",
        location: { lat: 12.93, lng: 77.62, wardId: WARD_A, wardName: "Bellandur" },
        durationBucket: "TODAY",
        affectedScale: 0.1,
        hazardFlags: [],
        reporterUid: REPORTER_FEW,
        reporterDisplayName: "Few Reporter",
        supporterCount: 0,
        priority: { score: 30, band: "LOW" },
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    await batch.commit();
  });

  afterAll(async () => {
    // Clean up all seeded test docs in chunks of 400
    const chunkSize = 400;
    for (let i = 0; i < testDocIds.length; i += chunkSize) {
      const chunk = testDocIds.slice(i, i + chunkSize);
      const batch = firestore.batch();
      for (const id of chunk) {
        batch.delete(firestore.collection("complaints").doc(id));
      }
      await batch.commit();
    }
  });

  describe("Challenge 1: Default Limit (20) & Strict Read Bounds", () => {
    it("returns strictly at most 20 documents when 45 matching records exist", async () => {
      const result = await listComplaints({ reporterUid: REPORTER_MANY });
      expect(result).toBeDefined();
      expect(result.length).toBe(20);
      expect(result.complaints.length).toBe(20);
      expect(result.nextCursor).toBeDefined();
      expect(typeof result.nextCursor).toBe("string");
    });

    it("respects explicit small limit (e.g. limit=7)", async () => {
      const result = await listComplaints({ reporterUid: REPORTER_MANY, limit: 7 });
      expect(result.length).toBe(7);
      expect(result.nextCursor).toBeDefined();
    });

    it("respects explicit large limit (e.g. limit=35) when dataset is larger", async () => {
      const result = await listComplaints({ reporterUid: REPORTER_MANY, limit: 35 });
      expect(result.length).toBe(35);
      expect(result.nextCursor).toBeDefined();
    });

    it("handles boundary condition limit=0 gracefully", async () => {
      const result = await listComplaints({ reporterUid: REPORTER_MANY, limit: 0 });
      expect(result.length).toBe(0);
      expect(result.nextCursor).toBeUndefined();
    });

    it("handles boundary condition limit=1 returning single document with valid cursor", async () => {
      const result = await listComplaints({ reporterUid: REPORTER_MANY, limit: 1 });
      expect(result.length).toBe(1);
      expect(result.nextCursor).toBeDefined();
      expect(result.nextCursor).toBe(result[0]!.id);
    });
  });

  describe("Challenge 2: Cursor Pagination with .startAfter() & Non-Overlap", () => {
    it("paginates 45 documents across 3 pages with 0 overlap and 100% union completeness", async () => {
      const PAGE_SIZE = 18;

      // Page 1
      const page1 = await listComplaints({ reporterUid: REPORTER_MANY, limit: PAGE_SIZE });
      expect(page1.length).toBe(PAGE_SIZE);
      expect(page1.nextCursor).toBeDefined();

      // Page 2
      const page2 = await listComplaints({
        reporterUid: REPORTER_MANY,
        limit: PAGE_SIZE,
        cursor: page1.nextCursor,
      });
      expect(page2.length).toBe(PAGE_SIZE);
      expect(page2.nextCursor).toBeDefined();

      // Page 3
      const page3 = await listComplaints({
        reporterUid: REPORTER_MANY,
        limit: PAGE_SIZE,
        cursor: page2.nextCursor,
      });
      expect(page3.length).toBe(45 - PAGE_SIZE * 2); // 45 - 36 = 9
      expect(page3.nextCursor).toBeUndefined(); // < PAGE_SIZE indicates end of collection

      const ids1 = page1.map((c) => c.id);
      const ids2 = page2.map((c) => c.id);
      const ids3 = page3.map((c) => c.id);

      // Verify ZERO overlap between page 1 and page 2
      const overlap12 = ids1.filter((id) => ids2.includes(id));
      expect(overlap12).toHaveLength(0);

      // Verify ZERO overlap between page 2 and page 3
      const overlap23 = ids2.filter((id) => ids3.includes(id));
      expect(overlap23).toHaveLength(0);

      // Verify ZERO overlap between page 1 and page 3
      const overlap13 = ids1.filter((id) => ids3.includes(id));
      expect(overlap13).toHaveLength(0);

      // Verify exact union completeness
      const allFetchedIds = new Set([...ids1, ...ids2, ...ids3]);
      expect(allFetchedIds.size).toBe(45);
      for (let i = 1; i <= 45; i++) {
        expect(allFetchedIds.has(`challenger-m2-doc-many-${String(i).padStart(3, "0")}`)).toBe(true);
      }
    });

    it("supports cursor passed as a Firestore DocumentSnapshot object", async () => {
      const page1 = await listComplaints({ reporterUid: REPORTER_MANY, limit: 10 });
      expect(page1.length).toBe(10);
      const lastDocId = page1[page1.length - 1]!.id;

      const docSnap = await firestore.collection("complaints").doc(lastDocId).get();
      expect(docSnap.exists).toBe(true);

      const page2WithSnap = await listComplaints({
        reporterUid: REPORTER_MANY,
        limit: 10,
        cursor: docSnap,
      });

      const page2WithString = await listComplaints({
        reporterUid: REPORTER_MANY,
        limit: 10,
        cursor: lastDocId,
      });

      expect(page2WithSnap.map((c) => c.id)).toEqual(page2WithString.map((c) => c.id));
    });

    it("handles non-existent or invalid cursor gracefully without throwing", async () => {
      const result = await listComplaints({
        reporterUid: REPORTER_MANY,
        cursor: "challenger-non-existent-doc-id-99999",
      });
      // Should gracefully execute without throwing 500 error
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(20);
    });

    it("handles cursor pointing to the final document returning empty next page", async () => {
      const allDocs = await listComplaints({ reporterUid: REPORTER_MANY, limit: 45 });
      const lastDocId = allDocs[allDocs.length - 1]!.id;

      const beyondEnd = await listComplaints({
        reporterUid: REPORTER_MANY,
        cursor: lastDocId,
      });
      expect(beyondEnd.length).toBe(0);
      expect(beyondEnd.nextCursor).toBeUndefined();
    });

    it("supports offset pagination fallback when offset is provided instead of cursor", async () => {
      const page1 = await listComplaints({ reporterUid: REPORTER_MANY, limit: 10 });
      const page2Offset = await listComplaints({ reporterUid: REPORTER_MANY, limit: 10, offset: 10 });

      expect(page1.length).toBe(10);
      expect(page2Offset.length).toBe(10);
      const page1Ids = page1.map((c) => c.id);
      for (const item of page2Offset) {
        expect(page1Ids.includes(item.id)).toBe(false);
      }
    });
  });

  describe("Challenge 3: Filter Pushdown to Database Level", () => {
    it("empirically proves departmentId pushdown: finds minority department despite 25 newer records in another department", async () => {
      // 25 DEPT_SECONDARY records were seeded with much newer timestamps than the 5 DEPT_MINORITY records.
      // If departmentId was NOT pushed to Firestore, reading limit(20) would return 20 DEPT_SECONDARY docs
      // and in-memory filter would yield 0.
      const result = await listComplaints({ departmentId: DEPT_MINORITY });
      expect(result.length).toBe(5);
      expect(result.every((c) => c.departmentId === DEPT_MINORITY)).toBe(true);
    });

    it("empirically proves reporterUid pushdown: finds target reporter despite larger collection of other reporters", async () => {
      const result = await listComplaints({ reporterUid: REPORTER_FEW });
      // REPORTER_FEW has 5 DEPT_MINORITY docs + 25 RESOLVED docs = 30 total
      expect(result.length).toBe(20); // capped by default limit 20
      expect(result.every((c) => c.reporterUid === REPORTER_FEW)).toBe(true);
    });

    it("empirically proves status 'OPEN_ALL' pushdown: finds open docs despite 25 newer resolved docs for the same reporter", async () => {
      // REPORTER_FEW has 25 newer RESOLVED docs and 5 older ASSIGNED (OPEN) docs.
      // In-memory filter on limit(20) would see only the 20 newest RESOLVED docs and return 0.
      // With Firestore pushdown, it must return the 5 ASSIGNED docs.
      const result = await listComplaints({ reporterUid: REPORTER_FEW, status: "OPEN_ALL" });
      expect(result.length).toBe(5);
      expect(result.every((c) => OPEN_STATUSES.includes(c.status as (typeof OPEN_STATUSES)[number]))).toBe(true);
      expect(result.every((c) => c.status !== "RESOLVED" && c.status !== "CLOSED" && c.status !== "REJECTED")).toBe(true);
    });

    it("verifies single status filter pushdown (e.g. status === 'RESOLVED')", async () => {
      const result = await listComplaints({ reporterUid: REPORTER_FEW, status: "RESOLVED", limit: 30 });
      expect(result.length).toBe(25);
      expect(result.every((c) => c.status === "RESOLVED")).toBe(true);
    });

    it("verifies statuses array filter pushdown (e.g. statuses: ['RESOLVED', 'CLOSED'])", async () => {
      const result = await listComplaints({
        reporterUid: REPORTER_MANY,
        statuses: ["RESOLVED", "CLOSED"],
        limit: 50,
      });
      // 5 RESOLVED + 5 CLOSED = 10
      expect(result.length).toBe(10);
      expect(result.every((c) => c.status === "RESOLVED" || c.status === "CLOSED")).toBe(true);
    });

    it("verifies multi-field filter pushdown: reporterUid + departmentId + status: 'OPEN_ALL'", async () => {
      const result = await listComplaints({
        reporterUid: REPORTER_MANY,
        departmentId: DEPT_PRIMARY,
        status: "OPEN_ALL",
        limit: 50,
      });

      // REPORTER_MANY has exactly 30 OPEN complaints in DEPT_PRIMARY
      expect(result.length).toBe(30);
      expect(result.every((c) => c.reporterUid === REPORTER_MANY)).toBe(true);
      expect(result.every((c) => c.departmentId === DEPT_PRIMARY)).toBe(true);
      expect(result.every((c) => OPEN_STATUSES.includes(c.status as (typeof OPEN_STATUSES)[number]))).toBe(true);
    });

    it("verifies wardId filter pushdown to location.wardId", async () => {
      const resultWardA = await listComplaints({
        reporterUid: REPORTER_MANY,
        wardId: WARD_A,
        limit: 50,
      });
      // 45 complaints seeded: even indices got WARD_A (2,4,6...44 = 22 items)
      expect(resultWardA.length).toBe(22);
      expect(resultWardA.every((c) => c.location.wardId === WARD_A)).toBe(true);
    });

    it("verifies isPublicOnly filter pushdown excluding private documents", async () => {
      // Document 45 was explicitly set to visibility: "private"
      const allDocs = await listComplaints({ reporterUid: REPORTER_MANY, limit: 50 });
      expect(allDocs.some((c) => c.visibility === "private")).toBe(true);

      const publicOnly = await listComplaints({
        reporterUid: REPORTER_MANY,
        isPublicOnly: true,
        limit: 50,
      });
      expect(publicOnly.length).toBe(44); // 45 - 1 private
      expect(publicOnly.every((c) => c.visibility === "public")).toBe(true);
    });
  });

  describe("Challenge 4: Dual-Interface & Serialization Compatibility", () => {
    it("satisfies dual-interface contract: works as standard Array and as { complaints, nextCursor }", async () => {
      const result = await listComplaints({ reporterUid: REPORTER_FEW, status: "OPEN_ALL" });

      // Array interface
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
      expect(result[0]).toBeDefined();
      expect(result.map((c) => c.id)).toHaveLength(5);
      expect(result.filter((c) => c.departmentId === DEPT_MINORITY)).toHaveLength(5);

      // Object destructuring interface
      const { complaints, nextCursor } = result;
      expect(Array.isArray(complaints)).toBe(true);
      expect(complaints).toHaveLength(5);
      expect(nextCursor).toBeUndefined(); // < 20 docs
    });

    it("JSON serializes safely as a JSON array for API responses", async () => {
      const result = await listComplaints({ reporterUid: REPORTER_FEW, status: "OPEN_ALL" });
      const jsonString = JSON.stringify(result);
      const parsed = JSON.parse(jsonString);

      // When serialized with JSON.stringify, an Array subclass / augmented Array serializes as a JSON array
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(5);
    });
  });

  describe("Challenge 5: Aggregation vs Scan (getComplaintCounts)", () => {
    it("accurately calculates exact counts without scanning collections into memory", async () => {
      const countsMany = await getComplaintCounts({ reporterUid: REPORTER_MANY });
      expect(countsMany.total).toBe(45);
      expect(countsMany.open).toBe(30);
      // In getComplaintCounts: status in ["RESOLVED", "CLOSED"]
      // 5 RESOLVED + 5 CLOSED = 10 (REJECTED is neither OPEN nor RESOLVED/CLOSED)
      expect(countsMany.resolved).toBe(10);

      const countsFew = await getComplaintCounts({ reporterUid: REPORTER_FEW });
      expect(countsFew.total).toBe(30); // 25 resolved + 5 assigned
      expect(countsFew.open).toBe(5);
      expect(countsFew.resolved).toBe(25);
    });
  });
});
