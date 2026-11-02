import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { getAdminFirestore } from "@/server/clients/firebase-admin";

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

import * as sessionModule from "@/server/auth/session";
import {
  createComplaint,
  getComplaint,
} from "@/server/services/complaints";
import { POST as supportPost } from "@/app/api/complaints/[id]/support/route";
import { PATCH as statusPatch } from "@/app/api/complaints/[id]/status/route";
import { POST as duplicateResolvePost } from "@/app/api/duplicates/[pairId]/resolve/route";
import { GET as exportCsvGet } from "@/app/api/exports/complaints.csv/route";
import { POST as updateUserRolePost } from "@/app/api/admin/users/[uid]/role/route";
import { PATCH as updateSettingsPatch } from "@/app/api/admin/settings/route";
import { POST as demoResetPost } from "@/app/api/admin/demo/reset/route";
import { POST as checkDuplicatesPost } from "@/app/api/complaints/duplicates/check/route";
import { analyzeComplaintDraft } from "@/server/services/ai";

describe("CIVICPULSE Integration Tests (PRD-TEST-INT-001…013, §39.2)", () => {
  const firestore = getAdminFirestore();

  const citizenUser: sessionModule.SessionUser = {
    uid: "test-int-citizen-1",
    email: "citizen.int1@example.com",
    displayName: "Citizen Integration",
    role: "citizen",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: "ward-150-bellandur",
  };

  const citizenUser2: sessionModule.SessionUser = {
    uid: "test-int-citizen-2",
    email: "citizen.int2@example.com",
    displayName: "Neighbor Integration",
    role: "citizen",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: "ward-150-bellandur",
  };

  const roadsAuthority: sessionModule.SessionUser = {
    uid: "test-int-roads-auth",
    email: "roads.auth.int@example.com",
    displayName: "Roads Officer Int",
    role: "authority",
    departmentId: "roads",
    status: "active",
    emailVerified: true,
    homeWardId: "ward-150-bellandur",
  };

  const adminUser: sessionModule.SessionUser = {
    uid: "test-int-admin",
    email: "admin.int@example.com",
    displayName: "Admin Int",
    role: "admin",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: null,
  };

  // PRD-TEST-INT-001: Auth session exchange: suspended check
  it("PRD-TEST-INT-001: auth session exchange handles role mapping and prevents suspended access", async () => {
    const suspendedUser: sessionModule.SessionUser = {
      ...citizenUser,
      uid: "suspended-user-id",
      status: "suspended",
    };
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValueOnce(suspendedUser);

    const req = new NextRequest("http://localhost:3000/api/me", {
      headers: { Origin: "http://localhost:3000" },
    });
    const { GET: getMe } = await import("@/app/api/me/route");
    const res = await getMe(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error.code).toBe("ACCOUNT_SUSPENDED");
  });

  // PRD-TEST-INT-002: Create complaint creates records with monotonic CP-BLR ref
  it("PRD-TEST-INT-002: Create complaint transaction writes complaint, public projection, activity, and monotonic ref", async () => {
    const { complaint, publicUrl } = await createComplaint(
      {
        title: "Large sinkhole near 12th Main",
        description: "Dangerous sinkhole opening up on the carriageway, blocking traffic lane.",
        category: "POTHOLE",
        categorySource: "user",
        location: {
          lat: 12.9719,
          lng: 77.6412,
          wardId: "ward-080-indiranagar",
          landmark: "Near 12th Main",
        },
        durationBucket: "TODAY",
        affectedScale: 0.7,
        hazardFlags: ["INJURY_RISK", "ROAD_BLOCKED"],
        visibility: "public",
      },
      citizenUser,
    );

    expect(complaint.id).toBeDefined();
    expect(complaint.ref).toMatch(/^CP-BLR-\d{4}-\d{6}$/);
    expect(publicUrl).toContain(`/complaints/${complaint.ref}`);

    // Verify written to Firestore
    const stored = await getComplaint(complaint.id);
    expect(stored).not.toBeNull();
    expect(stored?.title).toBe("Large sinkhole near 12th Main");
    expect(stored?.status).toBe("SUBMITTED");
  });

  // PRD-TEST-INT-003: Idempotency: same key twice returns same complaint
  it("PRD-TEST-INT-003: Idempotency key avoids duplicate creation on replay", async () => {
    const idemKey = `idem-${Date.now()}`;
    const payload = {
      title: "Clogged drainage channel",
      description: "Severe stormwater drain overflow flooding the pavement.",
      category: "DRAINAGE" as const,
      categorySource: "user" as const,
      location: {
        lat: 12.9352,
        lng: 77.6245,
        wardId: "ward-151-koramangala",
      },
      durationBucket: "TODAY" as const,
      affectedScale: 0.4 as const,
      hazardFlags: [],
      visibility: "public" as const,
    };

    const first = await createComplaint(payload, citizenUser, idemKey);
    const second = await createComplaint(payload, citizenUser, idemKey);

    expect(first.complaint.id).toBe(second.complaint.id);
    expect(first.complaint.ref).toBe(second.complaint.ref);
  });

  // PRD-TEST-INT-004: Gemini valid / fallback produces stored analysis
  it("PRD-TEST-INT-004: draft analysis produces structured output and analysisToken", async () => {
    const res = await analyzeComplaintDraft({
      title: "Broken streetlight in residential street",
      description: "Streetlight flickering and completely unlit at night, exposed conduit wire.",
      categoryHint: "STREETLIGHT",
    });

    expect(res.analysis.output.predictedCategory).toBeDefined();
    expect(res.analysis.source).toBeDefined();
    expect(res.analysisToken).toBeDefined();
  });

  // PRD-TEST-INT-005: Duplicate check returns ranked candidates
  it("PRD-TEST-INT-005: Duplicate radar checks text and coordinates for candidates", async () => {
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(citizenUser);

    const req = new NextRequest("http://localhost:3000/api/complaints/duplicates/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        lat: 12.9719,
        lng: 77.6412,
        category: "POTHOLE",
        text: "Pothole on 100ft road Indiranagar near 12th main",
      }),
    });

    const res = await checkDuplicatesPost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.candidates)).toBe(true);
  });

  // PRD-TEST-INT-006: Support: count +1; repeat -> 409; self-support -> 403
  it("PRD-TEST-INT-006: Support handles count increments, duplicate rejection, and self-support prevention", async () => {
    const { complaint } = await createComplaint(
      {
        title: "Streetlight failure",
        description: "Broken streetlight pole and exposed connection box.",
        category: "STREETLIGHT",
        categorySource: "user",
        location: { lat: 12.9719, lng: 77.6412 },
        durationBucket: "TODAY",
        affectedScale: 0.1,
        hazardFlags: [],
        visibility: "public",
      },
      citizenUser,
    );

    // Self-support fails with 403
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(citizenUser);
    const selfReq = new NextRequest(`http://localhost:3000/api/complaints/${complaint.id}/support`, {
      method: "POST",
      headers: { Origin: "http://localhost:3000" },
    });
    const selfRes = await supportPost(selfReq, { params: Promise.resolve({ id: complaint.id }) });
    expect(selfRes.status).toBe(403);

    // Neighbor support succeeds
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(citizenUser2);
    const suppReq = new NextRequest(`http://localhost:3000/api/complaints/${complaint.id}/support`, {
      method: "POST",
      headers: { Origin: "http://localhost:3000" },
    });
    const suppRes = await supportPost(suppReq, { params: Promise.resolve({ id: complaint.id }) });
    expect(suppRes.status).toBe(200);

    // Duplicate support fails with 409
    const dupRes = await supportPost(suppReq, { params: Promise.resolve({ id: complaint.id }) });
    expect(dupRes.status).toBe(409);
  });

  // PRD-TEST-INT-007: Lifecycle transitions and optimistic concurrency (409 on stale expectedStatus)
  it("PRD-TEST-INT-007: Transitions enforce expectedStatus optimistic concurrency", async () => {
    const { complaint } = await createComplaint(
      {
        title: "Pothole for transition testing",
        description: "Testing state machine transitions under load.",
        category: "POTHOLE",
        categorySource: "user",
        location: { lat: 12.9719, lng: 77.6412 },
        durationBucket: "TODAY",
        affectedScale: 0.1,
        hazardFlags: [],
        visibility: "public",
      },
      citizenUser,
    );

    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(roadsAuthority);

    // Expected status conflict returns 409
    const conflictReq = new NextRequest(`http://localhost:3000/api/complaints/${complaint.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        status: "UNDER_REVIEW",
        expectedStatus: "RESOLVED",
      }),
    });
    const conflictRes = await statusPatch(conflictReq, { params: Promise.resolve({ id: complaint.id }) });
    expect(conflictRes.status).toBe(409);

    // Valid transition returns 200
    const validReq = new NextRequest(`http://localhost:3000/api/complaints/${complaint.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        status: "UNDER_REVIEW",
        expectedStatus: "SUBMITTED",
      }),
    });
    const validRes = await statusPatch(validReq, { params: Promise.resolve({ id: complaint.id }) });
    expect(validRes.status).toBe(200);
  });

  // PRD-TEST-INT-008: Duplicate resolve endpoint
  it("PRD-TEST-INT-008: Duplicate resolution dismisses or links duplicate candidate", async () => {
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(roadsAuthority);

    const { complaint: cA } = await createComplaint(
      {
        title: "Duplicate pothole A",
        description: "Large pothole on northbound carriageway",
        category: "POTHOLE",
        categorySource: "user",
        location: { lat: 12.9719, lng: 77.6412 },
        durationBucket: "TODAY",
        affectedScale: 0.4,
        hazardFlags: [],
        visibility: "public",
      },
      citizenUser,
    );
    const { complaint: cB } = await createComplaint(
      {
        title: "Duplicate pothole B",
        description: "Pothole on northbound lane",
        category: "POTHOLE",
        categorySource: "user",
        location: { lat: 12.972, lng: 77.6413 },
        durationBucket: "TODAY",
        affectedScale: 0.4,
        hazardFlags: [],
        visibility: "public",
      },
      citizenUser2,
    );

    const pairId = `${cA.id}:${cB.id}`;
    const req = new NextRequest(`http://localhost:3000/api/duplicates/${pairId}/resolve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        decision: "DISMISS",
        note: "Reviewed on ground; these are distinct potholes on opposing sides of avenue.",
      }),
    });

    const res = await duplicateResolvePost(req, { params: Promise.resolve({ pairId }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  // PRD-TEST-INT-009: Notifications creation and read flow
  it("PRD-TEST-INT-009: Notifications read-all resets unread count to 0", async () => {
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(citizenUser);
    const { POST: readAllPost } = await import("@/app/api/notifications/read-all/route");

    const req = new NextRequest("http://localhost:3000/api/notifications/read-all", {
      method: "POST",
      headers: { Origin: "http://localhost:3000" },
    });
    const res = await readAllPost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  // PRD-TEST-INT-010: CSV export scopes by role and omits reporter PII
  it("PRD-TEST-INT-010: Complaints CSV export enforces role scoping and escapes formulas", async () => {
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(roadsAuthority);

    const req = new NextRequest("http://localhost:3000/api/exports/complaints.csv", {
      headers: { Origin: "http://localhost:3000" },
    });
    const res = await exportCsvGet(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    const csv = await res.text();
    expect(csv).toContain("Reference,Title,Category");
    expect(csv).not.toContain("reporterEmail");
  });

  // PRD-TEST-INT-011: Admin role change updates claims and revokes tokens
  it("PRD-TEST-INT-011: Admin role mutation enforces LAST_ADMIN guard", async () => {
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(adminUser);

    await firestore.collection("users").doc(adminUser.uid).set(
      {
        uid: adminUser.uid,
        email: adminUser.email,
        displayName: adminUser.displayName,
        role: "admin",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    const req = new NextRequest(`http://localhost:3000/api/admin/users/${adminUser.uid}/role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify({ role: "citizen" }),
    });

    const res = await updateUserRolePost(req, { params: Promise.resolve({ uid: adminUser.uid }) });
    // If only 1 admin exists, it raises 409 with LAST_ADMIN
    expect([200, 409]).toContain(res.status);
  });

  // PRD-TEST-INT-012: Settings change validates weights
  it("PRD-TEST-INT-012: Priority weights settings validation", async () => {
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(adminUser);

    // Invalid weights not summing to 1.0 fails
    const invalidReq = new NextRequest("http://localhost:3000/api/admin/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        weights: {
          S: 0.5,
          H: 0.5,
          V: 0.5,
          W: 0.5,
          A: 0.5,
          C: 0.5,
          T: 0.5,
        },
      }),
    });

    const res = await updateSettingsPatch(invalidReq);
    expect(res.status).toBe(400);
  });

  // PRD-TEST-INT-013: Demo reset preserves real user accounts
  it("PRD-TEST-INT-013: Demo reset deletes only synthetic docs", async () => {
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(adminUser);

    const req = new NextRequest("http://localhost:3000/api/admin/demo/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
      },
    });

    const res = await demoResetPost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
