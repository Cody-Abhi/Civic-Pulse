import { describe, it, expect, vi, beforeEach } from "vitest";
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

import { POST as createComplaintPost } from "@/app/api/complaints/route";
import { POST as addNotePost } from "@/app/api/complaints/[id]/notes/route";
import { POST as bulkTransitionPost } from "@/app/api/complaints/bulk-transition/route";
import { GET as exportCsvGet } from "@/app/api/exports/complaints.csv/route";
import { GET as getMe, PATCH as patchMe } from "@/app/api/me/route";
import { GET as exportMeGet } from "@/app/api/me/export/route";
import { GET as getDeptMap } from "@/app/api/map/department/route";
import { GET as getDeptAnalytics } from "@/app/api/analytics/department/route";

import * as sessionModule from "@/server/auth/session";
import { createComplaint } from "@/server/repositories/complaints.repo";

describe("BLOCK 5: Missing Pages, APIs, GeoJSON & CSV Export (§21.1, §25.3, §30, §36.4)", () => {
  const firestore = getAdminFirestore();

  const citizenUser: sessionModule.SessionUser = {
    uid: "test-block5-citizen",
    email: "citizen.b5@example.com",
    displayName: "Citizen Block Five",
    role: "citizen",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: "ward-150-bellandur",
  };

  const roadsAuthority: sessionModule.SessionUser = {
    uid: "test-block5-roads",
    email: "roads.b5@example.com",
    displayName: "Roads Officer B5",
    role: "authority",
    departmentId: "roads",
    status: "active",
    emailVerified: true,
    homeWardId: "ward-150-bellandur",
  };

  const wasteAuthority: sessionModule.SessionUser = {
    uid: "test-block5-waste",
    email: "waste.b5@example.com",
    displayName: "Waste Officer B5",
    role: "authority",
    departmentId: "waste",
    status: "active",
    emailVerified: true,
    homeWardId: "ward-150-bellandur",
  };

  const adminUser: sessionModule.SessionUser = {
    uid: "test-block5-admin",
    email: "admin.b5@example.com",
    displayName: "City Admin B5",
    role: "admin",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: "ward-150-bellandur",
  };

  beforeEach(async () => {
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(citizenUser);
    await firestore.collection("users").doc(citizenUser.uid).set({
      uid: citizenUser.uid,
      email: citizenUser.email,
      displayName: citizenUser.displayName,
      role: "citizen",
      homeWardId: "ward-150-bellandur",
      status: "active",
    }, { merge: true });
  });

  it("POST /api/complaints rejects location outside Bengaluru with 400 OUTSIDE_CITY", async () => {
    const req = new NextRequest("http://localhost:3000/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Report outside Bengaluru",
        description: "Testing coordinates outside city boundary limits to ensure rejection",
        category: "POTHOLE",
        categorySource: "user",
        location: {
          lat: 28.6139, // New Delhi
          lng: 77.2090,
          landmark: "India Gate",
        },
        affectedScale: 0.4,
        durationBucket: "FEW_DAYS",
        visibility: "public",
        hazardFlags: [],
      }),
    });

    const res = await createComplaintPost(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("OUTSIDE_CITY");
  });

  it("POST /api/complaints/[id]/notes enforces role & department policies", async () => {
    // 1. Create a road complaint
    const { complaint } = await createComplaint(
      {
        title: "Pothole on Outer Ring Road",
        description: "Dangerous pothole near Bellandur flyover service road",
        category: "POTHOLE",
        categorySource: "user",
        location: { lat: 12.9304, lng: 77.6784, landmark: "Bellandur Flyover" },
        affectedScale: 0.4,
        durationBucket: "FEW_DAYS",
        visibility: "public",
        hazardFlags: [],
      },
      citizenUser,
    );

    // 2. Citizen attempt -> 403 Forbidden
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(citizenUser);
    const citReq = new NextRequest(`http://localhost:3000/api/complaints/${complaint.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "Citizen trying to add internal note" }),
    });
    const citRes = await addNotePost(citReq, { params: Promise.resolve({ id: complaint.id }) });
    expect(citRes.status).toBe(403);

    // 3. Different department (Waste) -> 404 Not Found
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(wasteAuthority);
    const wasteReq = new NextRequest(`http://localhost:3000/api/complaints/${complaint.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "Waste officer note on road complaint" }),
    });
    const wasteRes = await addNotePost(wasteReq, { params: Promise.resolve({ id: complaint.id }) });
    expect(wasteRes.status).toBe(404);

    // 4. Same department (Roads) -> 201 Created
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(roadsAuthority);
    const roadReq = new NextRequest(`http://localhost:3000/api/complaints/${complaint.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "Inspected by engineer. Work order dispatched.", visibleToReporter: true }),
    });
    const roadRes = await addNotePost(roadReq, { params: Promise.resolve({ id: complaint.id }) });
    expect(roadRes.status).toBe(201);
    const roadData = await roadRes.json();
    expect(roadData.success).toBe(true);
    expect(roadData.activity.action).toBe("NOTE_ADDED");
  });

  it("POST /api/complaints/bulk-transition transitions multiple complaints atomically", async () => {
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(roadsAuthority);

    const { complaint: c1 } = await createComplaint(
      {
        title: "Bulk test 1",
        description: "Pothole in HSR Layout sector 1 main street",
        category: "POTHOLE",
        categorySource: "user",
        location: { lat: 12.9121, lng: 77.6446, landmark: "HSR Sector 1" },
        affectedScale: 0.4,
        durationBucket: "FEW_DAYS",
        visibility: "public",
        hazardFlags: [],
      },
      citizenUser,
    );

    const { complaint: c2 } = await createComplaint(
      {
        title: "Bulk test 2",
        description: "Pothole in HSR Layout sector 2 main street",
        category: "POTHOLE",
        categorySource: "user",
        location: { lat: 12.9121, lng: 77.6446, landmark: "HSR Sector 2" },
        affectedScale: 0.4,
        durationBucket: "FEW_DAYS",
        visibility: "public",
        hazardFlags: [],
      },
      citizenUser,
    );

    const req = new NextRequest("http://localhost:3000/api/complaints/bulk-transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: [c1.id, c2.id],
        to: "UNDER_REVIEW",
        expectedStatus: "SUBMITTED",
        note: "Bulk triage by roads department",
      }),
    });

    const res = await bulkTransitionPost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total).toBe(2);
    expect(data.updated).toBe(2);
    expect(data.skipped).toBe(0);
  });

  it("GET /api/exports/complaints.csv generates injection-safe CSV and logs audit event", async () => {
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(adminUser);

    const req = new NextRequest("http://localhost:3000/api/exports/complaints.csv?departmentId=roads", {
      method: "GET",
    });

    const res = await exportCsvGet(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toContain("civicpulse-complaints-");

    const text = await res.text();
    expect(text).toContain("Reference,Title,Category,Department,Status");
  });

  it("GET /api/me, PATCH /api/me, and GET /api/me/export operate correctly", async () => {
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(citizenUser);

    // 1. GET /api/me
    const getReq = new NextRequest("http://localhost:3000/api/me");
    const getRes = await getMe(getReq);
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.user.email).toBe(citizenUser.email);

    // 2. PATCH /api/me
    const patchReq = new NextRequest("http://localhost:3000/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: "Citizen Five Updated",
        homeWardId: "ward-080-indiranagar",
        prefs: { defaultVisibility: "private", notifyWeeklyDigest: true },
      }),
    });
    const patchRes = await patchMe(patchReq);
    expect(patchRes.status).toBe(200);

    const userDoc = await firestore.collection("users").doc(citizenUser.uid).get();
    expect(userDoc.data()?.displayName).toBe("Citizen Five Updated");
    expect(userDoc.data()?.homeWardId).toBe("ward-080-indiranagar");
    expect(userDoc.data()?.prefs?.defaultVisibility).toBe("private");

    // 3. GET /api/me/export
    const expReq = new NextRequest("http://localhost:3000/api/me/export");
    const expRes = await exportMeGet(expReq);
    expect(expRes.status).toBe(200);
    const expData = await expRes.json();
    expect(expData.profile).toBeDefined();
    expect(Array.isArray(expData.complaints)).toBe(true);
  });

  it("GET /api/map/department and GET /api/analytics/department return cached payloads", async () => {
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(roadsAuthority);

    // Department map points
    const mapReq = new NextRequest("http://localhost:3000/api/map/department");
    const mapRes = await getDeptMap(mapReq);
    expect(mapRes.status).toBe(200);
    const mapData = await mapRes.json();
    expect(mapData.departmentId).toBe("roads");
    expect(Array.isArray(mapData.points)).toBe(true);

    // Department analytics
    const anReq = new NextRequest("http://localhost:3000/api/analytics/department?range=30d");
    const anRes = await getDeptAnalytics(anReq);
    expect(anRes.status).toBe(200);
    const anData = await anRes.json();
    expect(anData.departmentId).toBe("roads");
    expect(typeof anData.resolutionRatePct).toBe("number");
    expect(Array.isArray(anData.byWardTop)).toBe(true);
  });
});

