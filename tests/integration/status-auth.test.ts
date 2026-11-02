import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "@/app/api/complaints/[id]/status/route";
import * as sessionModule from "@/server/auth/session";
import * as complaintsModule from "@/server/services/complaints";
import type { Complaint } from "@/domain/types";

vi.mock("@/server/auth/session", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/server/services/complaints", () => ({
  getComplaint: vi.fn(),
  updateComplaintStatus: vi.fn(),
}));

describe("PATCH /api/complaints/[id]/status Security & Access Control (§21.1, §21.5)", () => {
  const dummyRoadsComplaint: Complaint = {
    id: "comp-roads-101",
    ref: "CP-BLR-2603-000101",
    cityId: "blr",
    reporterUid: "citizen-aarav-1",
    reporterDisplayName: "Aarav Patel",
    title: "Deep pothole on 100ft road",
    description: "Deep pothole near 12th main causing bike hazards",
    category: "POTHOLE",
    categorySource: "user",
    categoryConfirmed: true,
    aiCategory: "POTHOLE",
    aiConfidence: 0.95,
    departmentId: "roads",
    departmentName: "Roads & Infrastructure",
    assignedToUid: null,
    status: "SUBMITTED",
    statusChangedAt: new Date().toISOString(),
    priority: {
      score: 72,
      band: "HIGH",
      base: 72,
      adjustment: 0,
      factors: { S: 0.8, H: 0.7, R: 0.2, D: 0.8, A: 0.4, G: 0.1, T: 0.5 },
      lineItems: [],
      computedAt: new Date().toISOString(),
      weightsVersion: 1,
      provisional: false,
    },
    location: {
      lat: 12.9716,
      lng: 77.5946,
      geohash: "tdr1v",
      geohash5: "tdr1v",
      geohash6: "tdr1vn",
      wardId: "ward-150-bellandur",
      wardName: "Bellandur",
    },
    durationBucket: "OVER_TWO_WEEKS",
    affectedScale: 0.4,
    hazardFlags: ["INJURY_RISK"],
    visibility: "public",
    supporterUids: ["citizen-aarav-1"],
    supporterCount: 1,
    followerUids: [],
    independentReporterCount: 1,
    clusterRootId: null,
    linkedChildIds: [],
    pendingDuplicateCount: 0,
    verifiedSeverity: null,
    slaHours: 72,
    slaDueAt: new Date(Date.now() + 72 * 3600000).toISOString(),
    aiAnalysisId: null,
    aiStatus: "gemini",
    evidence: [],
    resolution: null,
    feedback: null,
    reopenCount: 0,
    isSynthetic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(complaintsModule.getComplaint).mockResolvedValue(dummyRoadsComplaint);
  });

  it("returns 401 UNAUTHENTICATED when request is unauthenticated", async () => {
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/complaints/comp-roads-101/status", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        status: "UNDER_REVIEW",
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "comp-roads-101" }) });
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns 403 FORBIDDEN when user has citizen role", async () => {
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
      uid: "citizen-user-1",
      email: "citizen@example.com",
      displayName: "Citizen User",
      role: "citizen",
      departmentId: null,
      status: "active",
      emailVerified: true,
      homeWardId: null,
    });

    const req = new NextRequest("http://localhost:3000/api/complaints/comp-roads-101/status", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        status: "UNDER_REVIEW",
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "comp-roads-101" }) });
    expect(res.status).toBe(403);

    const data = await res.json();
    expect(data.error.code).toBe("FORBIDDEN");
  });

  it("returns 404 NOT_FOUND when an authority from another department tries to transition", async () => {
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
      uid: "auth-sanitation-1",
      email: "sanitation.officer@example.com",
      displayName: "Sanitation Officer",
      role: "authority",
      departmentId: "solid_waste", // Different from "roads"
      status: "active",
      emailVerified: true,
      homeWardId: null,
    });

    const req = new NextRequest("http://localhost:3000/api/complaints/comp-roads-101/status", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        status: "UNDER_REVIEW",
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "comp-roads-101" }) });
    expect(res.status).toBe(404);

    const data = await res.json();
    expect(data.error.code).toBe("NOT_FOUND");
  });

  it("returns 409 INVALID_TRANSITION when expectedStatus does not match current complaint status", async () => {
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
      uid: "auth-roads-1",
      email: "roads.officer@example.com",
      displayName: "Roads Officer",
      role: "authority",
      departmentId: "roads",
      status: "active",
      emailVerified: true,
      homeWardId: null,
    });

    const req = new NextRequest("http://localhost:3000/api/complaints/comp-roads-101/status", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        status: "UNDER_REVIEW",
        expectedStatus: "ASSIGNED", // Mismatch! Current status is SUBMITTED
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "comp-roads-101" }) });
    expect(res.status).toBe(409);

    const data = await res.json();
    expect(data.error.code).toBe("INVALID_TRANSITION");
  });

  it("succeeds (200 OK) when authority from the same department executes a valid transition", async () => {
    vi.mocked(sessionModule.getSessionUser).mockResolvedValue({
      uid: "auth-roads-1",
      email: "roads.officer@example.com",
      displayName: "Roads Officer",
      role: "authority",
      departmentId: "roads",
      status: "active",
      emailVerified: true,
      homeWardId: null,
    });

    const updatedComplaint = { ...dummyRoadsComplaint, status: "UNDER_REVIEW" as const };
    vi.mocked(complaintsModule.updateComplaintStatus).mockResolvedValue(updatedComplaint);

    const req = new NextRequest("http://localhost:3000/api/complaints/comp-roads-101/status", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        status: "UNDER_REVIEW",
        expectedStatus: "SUBMITTED",
      }),
    });

    const res = await PATCH(req, { params: Promise.resolve({ id: "comp-roads-101" }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.complaint.status).toBe("UNDER_REVIEW");
  });
});
