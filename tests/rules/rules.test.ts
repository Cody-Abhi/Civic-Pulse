import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import fs from "fs";
import path from "path";

/**
 * Firestore Security Rules Unit Tests (§24, §39.3)
 * RULES-001 through RULES-012
 */

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  const rulesPath = path.resolve(process.cwd(), "firestore.rules");
  const rules = fs.readFileSync(rulesPath, "utf8");

  testEnv = await initializeTestEnvironment({
    projectId: "civic-pulse-rules-test",
    firestore: {
      rules,
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  // Seed baseline fixture documents using security rules disabled context
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    // Users
    await db.collection("users").doc("citizen-1").set({ uid: "citizen-1", role: "citizen" });
    await db.collection("users").doc("citizen-2").set({ uid: "citizen-2", role: "citizen" });
    await db.collection("users").doc("admin-1").set({ uid: "admin-1", role: "admin" });

    // Complaints
    await db.collection("complaints").doc("comp-1").set({
      id: "comp-1",
      reporterUid: "citizen-1",
      followerUids: ["citizen-2"],
      departmentId: "roads",
      title: "Pothole on 100ft road",
    });

    // Public complaints
    await db.collection("publicComplaints").doc("pub-1").set({
      id: "pub-1",
      title: "Public pothole notice",
    });

    // Complaint activities
    await db.collection("complaintActivities").doc("act-visible").set({
      id: "act-visible",
      complaintId: "comp-1",
      reporterUid: "citizen-1",
      departmentId: "roads",
      visibleToReporter: true,
      note: "Team assigned",
    });

    await db.collection("complaintActivities").doc("act-internal").set({
      id: "act-internal",
      complaintId: "comp-1",
      reporterUid: "citizen-1",
      departmentId: "roads",
      visibleToReporter: false,
      note: "Internal budget discussion",
    });

    // Notifications
    await db.collection("notifications").doc("notif-1").set({
      id: "notif-1",
      userId: "citizen-1",
      title: "Report status changed",
    });

    // Audit logs
    await db.collection("auditLogs").doc("log-1").set({
      id: "log-1",
      action: "ROLE_CHANGED",
      actorEmail: "admin@civicpulse.org",
    });

    // System counter (internal collection)
    await db.collection("counters").doc("seq-1").set({ current: 42 });
  });
});

describe("Firestore Security Rules (RULES-001…012, §24, §39.3)", () => {
  // RULES-001: Default deny covers internal collections (counters, idempotencyKeys)
  it("RULES-001: default deny covers unmatched/internal paths (counters)", async () => {
    const unauth = testEnv.unauthenticatedContext().firestore();
    const citizen = testEnv.authenticatedContext("citizen-1", { role: "citizen" }).firestore();

    await assertFails(unauth.collection("counters").doc("seq-1").get());
    await assertFails(citizen.collection("counters").doc("seq-1").get());
    await assertFails(citizen.collection("unknownCollection").doc("doc-1").get());
  });

  // RULES-002: User reads self only, or admin
  it("RULES-002: user reads own document; other user fails; admin succeeds", async () => {
    const cit1 = testEnv.authenticatedContext("citizen-1", { role: "citizen" }).firestore();
    const cit2 = testEnv.authenticatedContext("citizen-2", { role: "citizen" }).firestore();
    const adm = testEnv.authenticatedContext("admin-1", { role: "admin" }).firestore();

    await assertSucceeds(cit1.collection("users").doc("citizen-1").get());
    await assertFails(cit2.collection("users").doc("citizen-1").get());
    await assertSucceeds(adm.collection("users").doc("citizen-1").get());
  });

  // RULES-003: Citizen reads own complaint, not others'
  it("RULES-003: citizen reads own complaint, not other citizen's complaint", async () => {
    const cit1 = testEnv.authenticatedContext("citizen-1", { role: "citizen" }).firestore();
    const cit3 = testEnv.authenticatedContext("citizen-3", { role: "citizen" }).firestore();

    await assertSucceeds(cit1.collection("complaints").doc("comp-1").get());
    await assertFails(cit3.collection("complaints").doc("comp-1").get());
  });

  // RULES-004: Follower can read followed complaint
  it("RULES-004: follower can read followed complaint", async () => {
    const cit2 = testEnv.authenticatedContext("citizen-2", { role: "citizen" }).firestore();
    await assertSucceeds(cit2.collection("complaints").doc("comp-1").get());
  });

  // RULES-005: Authority reads own department complaints only
  it("RULES-005: authority reads complaints of own department only; other dept fails", async () => {
    const roadsAuth = testEnv
      .authenticatedContext("auth-roads", { role: "authority", departmentId: "roads" })
      .firestore();
    const swmAuth = testEnv
      .authenticatedContext("auth-swm", { role: "authority", departmentId: "swm" })
      .firestore();

    await assertSucceeds(roadsAuth.collection("complaints").doc("comp-1").get());
    await assertFails(swmAuth.collection("complaints").doc("comp-1").get());
  });

  // RULES-006: Admin reads all complaints
  it("RULES-006: admin can read any complaint", async () => {
    const adm = testEnv.authenticatedContext("admin-1", { role: "admin" }).firestore();
    await assertSucceeds(adm.collection("complaints").doc("comp-1").get());
  });

  // RULES-007: publicComplaints projection is publicly readable without auth
  it("RULES-007: publicComplaints can be read by anyone unauthenticated", async () => {
    const unauth = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(unauth.collection("publicComplaints").doc("pub-1").get());
  });

  // RULES-008: Activities respect visibleToReporter flag
  it("RULES-008: reporter can read visible activities, but internal notes fail", async () => {
    const cit1 = testEnv.authenticatedContext("citizen-1", { role: "citizen" }).firestore();
    const roadsAuth = testEnv
      .authenticatedContext("auth-roads", { role: "authority", departmentId: "roads" })
      .firestore();

    // Reporter sees visible note
    await assertSucceeds(cit1.collection("complaintActivities").doc("act-visible").get());
    // Reporter cannot see internal note
    await assertFails(cit1.collection("complaintActivities").doc("act-internal").get());
    // Authority sees both
    await assertSucceeds(roadsAuth.collection("complaintActivities").doc("act-internal").get());
  });

  // RULES-009: Notifications owner only
  it("RULES-009: notifications readable by owner only", async () => {
    const cit1 = testEnv.authenticatedContext("citizen-1", { role: "citizen" }).firestore();
    const cit2 = testEnv.authenticatedContext("citizen-2", { role: "citizen" }).firestore();

    await assertSucceeds(cit1.collection("notifications").doc("notif-1").get());
    await assertFails(cit2.collection("notifications").doc("notif-1").get());
  });

  // RULES-010: Every collection denies client writes (all writes go through Admin SDK)
  it("RULES-010: client writes (create/update/delete) are denied for all roles", async () => {
    const cit1 = testEnv.authenticatedContext("citizen-1", { role: "citizen" }).firestore();
    const roadsAuth = testEnv
      .authenticatedContext("auth-roads", { role: "authority", departmentId: "roads" })
      .firestore();
    const adm = testEnv.authenticatedContext("admin-1", { role: "admin" }).firestore();

    // Citizen write denied
    await assertFails(cit1.collection("complaints").doc("comp-hack").set({ title: "Hack" }));
    // Authority write denied
    await assertFails(roadsAuth.collection("complaints").doc("comp-1").update({ status: "RESOLVED" }));
    // Admin client write denied
    await assertFails(adm.collection("users").doc("citizen-1").delete());
  });

  // RULES-011: Suspended claims are denied access
  it("RULES-011: user with status claim 'suspended' is denied access", async () => {
    const suspendedCitizen = testEnv
      .authenticatedContext("citizen-suspended", { role: "citizen", status: "suspended" })
      .firestore();

    await assertFails(suspendedCitizen.collection("users").doc("citizen-suspended").get());
    await assertFails(suspendedCitizen.collection("departments").doc("roads").get());
  });

  // RULES-012: Audit logs are readable by admin only
  it("RULES-012: auditLogs collection is readable by admin only", async () => {
    const cit1 = testEnv.authenticatedContext("citizen-1", { role: "citizen" }).firestore();
    const roadsAuth = testEnv
      .authenticatedContext("auth-roads", { role: "authority", departmentId: "roads" })
      .firestore();
    const adm = testEnv.authenticatedContext("admin-1", { role: "admin" }).firestore();

    await assertFails(cit1.collection("auditLogs").doc("log-1").get());
    await assertFails(roadsAuth.collection("auditLogs").doc("log-1").get());
    await assertSucceeds(adm.collection("auditLogs").doc("log-1").get());
  });
});

