import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { getAdminFirestore } from "@/server/clients/firebase-admin";

/**
 * Challenger Adversarial Stress Test: Firestore Indexes & Query Compatibility
 * Milestone 1 (R1: Firestore Indexes and Rules Deployment)
 */
describe("Milestone 1 Challenger: Firestore Indexes & Rules Stress Test", () => {
  const firestore = getAdminFirestore();
  const rawIndexes = fs.readFileSync(path.resolve(process.cwd(), "firestore.indexes.json"), "utf8");
  const indexSpec = JSON.parse(rawIndexes);

  const testComplaintId = "comp-challenger-test-1";
  const testNotifId1 = "notif-challenger-test-1";
  const testNotifId2 = "notif-challenger-test-2";
  const testActivityId = "act-challenger-test-1";
  const testAuditId = "audit-challenger-test-1";
  const testAiId = "ai-challenger-test-1";

  beforeAll(async () => {
    const nowIso = new Date().toISOString();

    // Seed test complaint
    await firestore.collection("complaints").doc(testComplaintId).set({
      id: testComplaintId,
      ref: "CP-2601-TEST1",
      title: "Challenger Test Complaint Pothole",
      category: "POTHOLE",
      departmentId: "roads",
      departmentName: "Roads & Infrastructure",
      status: "OPEN",
      reporterUid: "challenger-citizen-1",
      followerUids: ["challenger-citizen-2"],
      priority: {
        score: 85,
        band: "CRITICAL",
        urgency: "HIGH",
        severity: "HIGH",
      },
      location: {
        lat: 12.9352,
        lng: 77.6245,
        wardId: "ward-150-bellandur",
        wardName: "Bellandur",
        geohash5: "tdr1v",
      },
      supporterCount: 12,
      slaDueAt: new Date(Date.now() + 86400000).toISOString(),
      createdAt: nowIso,
      updatedAt: nowIso,
      statusChangedAt: nowIso,
    });

    // Seed test notifications
    await firestore.collection("notifications").doc(testNotifId1).set({
      id: testNotifId1,
      userId: "challenger-citizen-1",
      type: "STATUS_CHANGE",
      title: "Update 1",
      body: "Test notification 1",
      read: false,
      createdAt: nowIso,
    });

    await firestore.collection("notifications").doc(testNotifId2).set({
      id: testNotifId2,
      userId: "challenger-citizen-1",
      type: "STATUS_CHANGE",
      title: "Update 2",
      body: "Test notification 2",
      read: true,
      createdAt: new Date(Date.now() - 1000).toISOString(),
    });

    // Seed test activity
    await firestore.collection("complaintActivities").doc(testActivityId).set({
      id: testActivityId,
      complaintId: testComplaintId,
      actorUid: "challenger-admin-1",
      action: "COMMENT",
      visibleToReporter: true,
      createdAt: nowIso,
    });

    // Seed test audit log
    await firestore.collection("auditLogs").doc(testAuditId).set({
      id: testAuditId,
      action: "CHALLENGER_TEST_ACTION",
      actorUid: "challenger-admin-1",
      targetId: "target-challenger-1",
      createdAt: nowIso,
    });

    // Seed test AI analysis
    await firestore.collection("aiAnalyses").doc(testAiId).set({
      id: testAiId,
      source: "gemini",
      inputHash: "hash-challenger-123",
      createdAt: nowIso,
    });
  });

  afterAll(async () => {
    await firestore.collection("complaints").doc(testComplaintId).delete();
    await firestore.collection("notifications").doc(testNotifId1).delete();
    await firestore.collection("notifications").doc(testNotifId2).delete();
    await firestore.collection("complaintActivities").doc(testActivityId).delete();
    await firestore.collection("auditLogs").doc(testAuditId).delete();
    await firestore.collection("aiAnalyses").doc(testAiId).delete();
  });

  describe("1. Schema & Quota Static Analysis", () => {
    it("adheres to Firebase tools FirestoreApi spec schema without error", () => {
      const result = execSync(
        `node -e "const fs = require('fs'); const { FirestoreApi } = require('./node_modules/firebase-tools/lib/firestore/api'); const spec = JSON.parse(fs.readFileSync('firestore.indexes.json', 'utf8')); new FirestoreApi().validateSpec(spec); console.log('SPEC_OK');"`,
        { encoding: "utf8" }
      );
      expect(result).toContain("SPEC_OK");
    });

    it("does not exceed Spark tier limit (max 200 composite indexes)", () => {
      expect(indexSpec.indexes.length).toBeLessThanOrEqual(200);
      expect(indexSpec.indexes.length).toBe(41);
    });

    it("has no duplicate index definitions", () => {
      const seen = new Set<string>();
      const duplicates: string[] = [];
      for (const idx of indexSpec.indexes) {
        const sig = `${idx.collectionGroup}:${idx.queryScope}:${idx.fields
          .map((f: { fieldPath: string; order?: string; arrayConfig?: string }) => `${f.fieldPath}:${f.order || f.arrayConfig}`)
          .join(",")}`;
        if (seen.has(sig)) {
          duplicates.push(sig);
        }
        seen.add(sig);
      }
      expect(duplicates).toEqual([]);
    });

    it("preserves all 6 required single-field exemptions (PRD §23.3)", () => {
      expect(indexSpec.fieldOverrides).toHaveLength(6);
      const exemptedPaths = indexSpec.fieldOverrides.map(
        (fo: { collectionGroup: string; fieldPath: string }) => `${fo.collectionGroup}.${fo.fieldPath}`,
      );
      expect(exemptedPaths).toContain("complaints.description");
      expect(exemptedPaths).toContain("publicComplaints.description");
      expect(exemptedPaths).toContain("aiAnalyses.inputRedacted");
      expect(exemptedPaths).toContain("aiAnalyses.output");
      expect(exemptedPaths).toContain("complaintEmbeddings.vector");
      expect(exemptedPaths).toContain("mapSnapshots.points");
    });
  });

  describe("2. Complaints Filter Combinations (Static Index Matching)", () => {
    // Check if an index exists in firestore.indexes.json for a given query profile
    function hasMatchingIndex(
      collectionGroup: string,
      equalityFields: string[],
      orderFields: { fieldPath: string; order: "ASCENDING" | "DESCENDING" }[],
    ): boolean {
      return indexSpec.indexes.some((idx: { collectionGroup: string; fields: { fieldPath: string; order?: string; arrayConfig?: string }[] }) => {
        if (idx.collectionGroup !== collectionGroup) return false;
        if (idx.fields.length !== equalityFields.length + orderFields.length) return false;

        const idxFields = idx.fields;
        const idxEqFields = idxFields.slice(0, equalityFields.length).map((f) => f.fieldPath);
        const idxOrderFields = idxFields.slice(equalityFields.length);

        // Equality fields can match in any permutation
        const eqMatches =
          equalityFields.length === idxEqFields.length &&
          equalityFields.every((f) => idxEqFields.includes(f));
        if (!eqMatches) return false;

        // Order fields must match in exact order and direction
        for (let i = 0; i < orderFields.length; i++) {
          const expected = orderFields[i];
          const actual = idxOrderFields[i];
          if (!expected || !actual) return false;
          if (actual.fieldPath !== expected.fieldPath || actual.order !== expected.order) {
            return false;
          }
        }
        return true;
      });
    }

    it("matches all 7 composite filter combinations on complaints with createdAt DESC", () => {
      // 1. departmentId + createdAt desc
      expect(
        hasMatchingIndex("complaints", ["departmentId"], [{ fieldPath: "createdAt", order: "DESCENDING" }]),
      ).toBe(true);

      // 2. category + createdAt desc
      expect(
        hasMatchingIndex("complaints", ["category"], [{ fieldPath: "createdAt", order: "DESCENDING" }]),
      ).toBe(true);

      // 3. status + createdAt desc
      expect(
        hasMatchingIndex("complaints", ["status"], [{ fieldPath: "createdAt", order: "DESCENDING" }]),
      ).toBe(true);

      // 4. departmentId + category + createdAt desc
      expect(
        hasMatchingIndex("complaints", ["departmentId", "category"], [{ fieldPath: "createdAt", order: "DESCENDING" }]),
      ).toBe(true);

      // 5. departmentId + status + createdAt desc
      expect(
        hasMatchingIndex("complaints", ["departmentId", "status"], [{ fieldPath: "createdAt", order: "DESCENDING" }]),
      ).toBe(true);

      // 6. category + status + createdAt desc
      expect(
        hasMatchingIndex("complaints", ["category", "status"], [{ fieldPath: "createdAt", order: "DESCENDING" }]),
      ).toBe(true);

      // 7. departmentId + category + status + createdAt desc
      expect(
        hasMatchingIndex("complaints", ["departmentId", "category", "status"], [{ fieldPath: "createdAt", order: "DESCENDING" }]),
      ).toBe(true);
    });

    it("matches FIFO createdAt ASC tie-breaker for authority and admin queues (PRD §23.3 lines 1914, 1920)", () => {
      // Authority queue: departmentId ASC, status ASC, priority.score DESC, createdAt ASC
      expect(
        hasMatchingIndex(
          "complaints",
          ["departmentId", "status"],
          [
            { fieldPath: "priority.score", order: "DESCENDING" },
            { fieldPath: "createdAt", order: "ASCENDING" },
          ],
        ),
      ).toBe(true);

      // Admin all complaints: status ASC, priority.score DESC, createdAt ASC
      expect(
        hasMatchingIndex(
          "complaints",
          ["status"],
          [
            { fieldPath: "priority.score", order: "DESCENDING" },
            { fieldPath: "createdAt", order: "ASCENDING" },
          ],
        ),
      ).toBe(true);
    });
  });

  describe("3. Empirical Query Execution Against Emulator", () => {
    it("executes all 8 combinations of complaints export queries successfully", async () => {
      const combos = [
        { label: "None (createdAt desc only)", dept: false, cat: false, stat: false },
        { label: "departmentId", dept: true, cat: false, stat: false },
        { label: "category", dept: false, cat: true, stat: false },
        { label: "status", dept: false, cat: false, stat: true },
        { label: "departmentId + category", dept: true, cat: true, stat: false },
        { label: "departmentId + status", dept: true, cat: false, stat: true },
        { label: "category + status", dept: false, cat: true, stat: true },
        { label: "departmentId + category + status", dept: true, cat: true, stat: true },
      ];

      for (const combo of combos) {
        let q: FirebaseFirestore.Query = firestore.collection("complaints");
        if (combo.dept) q = q.where("departmentId", "==", "roads");
        if (combo.cat) q = q.where("category", "==", "POTHOLE");
        if (combo.stat) q = q.where("status", "==", "OPEN");
        q = q.orderBy("createdAt", "desc").limit(10);

        const snap = await q.get();
        expect(snap).toBeDefined();
        expect(snap.empty).toBe(false);
      }
    });

    it("executes notification center queries without index errors", async () => {
      // Query 1: userId + createdAt desc
      const q1 = firestore
        .collection("notifications")
        .where("userId", "==", "challenger-citizen-1")
        .orderBy("createdAt", "desc")
        .limit(20);
      const snap1 = await q1.get();
      expect(snap1.docs.length).toBe(2);

      // Query 2: userId + read + createdAt desc
      const q2 = firestore
        .collection("notifications")
        .where("userId", "==", "challenger-citizen-1")
        .where("read", "==", false)
        .orderBy("createdAt", "desc")
        .limit(20);
      const snap2 = await q2.get();
      expect(snap2.docs.length).toBe(1);
    });

    it("executes authority queue and admin queue queries with priority score and createdAt ASC", async () => {
      // Authority queue: departmentId == 'roads', status == 'OPEN', priority.score DESC, createdAt ASC
      const authQueue = firestore
        .collection("complaints")
        .where("departmentId", "==", "roads")
        .where("status", "==", "OPEN")
        .orderBy("priority.score", "desc")
        .orderBy("createdAt", "asc")
        .limit(20);

      const authSnap = await authQueue.get();
      expect(authSnap.empty).toBe(false);

      // Admin queue: status == 'OPEN', priority.score DESC, createdAt ASC
      const adminQueue = firestore
        .collection("complaints")
        .where("status", "==", "OPEN")
        .orderBy("priority.score", "desc")
        .orderBy("createdAt", "asc")
        .limit(20);

      const adminSnap = await adminQueue.get();
      expect(adminSnap.empty).toBe(false);
    });

    it("executes complaintActivities and auditLogs queries", async () => {
      // Timeline: complaintId == testComplaintId, createdAt ASC
      const actSnap = await firestore
        .collection("complaintActivities")
        .where("complaintId", "==", testComplaintId)
        .orderBy("createdAt", "asc")
        .get();
      expect(actSnap.empty).toBe(false);

      // Audit logs: action == CHALLENGER_TEST_ACTION, createdAt DESC
      const auditSnap = await firestore
        .collection("auditLogs")
        .where("action", "==", "CHALLENGER_TEST_ACTION")
        .orderBy("createdAt", "desc")
        .get();
      expect(auditSnap.empty).toBe(false);
    });

    it("executes aiAnalyses deduplication query (inputHash, createdAt desc)", async () => {
      const aiSnap = await firestore
        .collection("aiAnalyses")
        .where("inputHash", "==", "hash-challenger-123")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
      expect(aiSnap.empty).toBe(false);
    });
  });
});
