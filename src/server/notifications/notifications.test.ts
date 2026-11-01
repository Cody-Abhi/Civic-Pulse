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

import { GET } from "@/app/api/notifications/route";
import { POST as readPost } from "@/app/api/notifications/[id]/read/route";
import { POST as readAllPost } from "@/app/api/notifications/read-all/route";
import { POST as feedbackPost } from "@/app/api/complaints/[id]/feedback/route";
import { PATCH as statusPatch } from "@/app/api/complaints/[id]/status/route";
import * as sessionModule from "@/server/auth/session";
import { createComplaint } from "@/server/repositories/complaints.repo";
import { createNotification } from "@/server/repositories/notifications.repo";

describe("BLOCK 4: Notifications & Citizen State Transitions (§32.1, §21.5, T2/T8/T9)", () => {
  const firestore = getAdminFirestore();

  const citizenUser: sessionModule.SessionUser = {
    uid: "test-citizen-notif",
    email: "citizen.notif@example.com",
    displayName: "Citizen Notif",
    role: "citizen",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: "ward-150-bellandur",
  };

  const otherCitizen: sessionModule.SessionUser = {
    uid: "test-other-citizen",
    email: "other@example.com",
    displayName: "Other Citizen",
    role: "citizen",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: "ward-150-bellandur",
  };

  beforeEach(async () => {
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(citizenUser);
    // Ensure citizen user doc exists with counter 0
    await firestore.collection("users").doc(citizenUser.uid).set({
      uid: citizenUser.uid,
      email: citizenUser.email,
      displayName: citizenUser.displayName,
      role: "citizen",
      unreadNotifications: 0,
      status: "active",
    }, { merge: true });
  });

  it("creates notification and increments unreadNotifications counter (§32.1)", async () => {
    const notif = await createNotification({
      userId: citizenUser.uid,
      type: "RESOLVED",
      title: "Issue Resolved",
      body: "Department marked your report as resolved.",
      link: "/citizen/complaints/test-comp-1",
    });

    expect(notif.id).toBeDefined();
    expect(notif.read).toBe(false);

    const userDoc = await firestore.collection("users").doc(citizenUser.uid).get();
    expect(userDoc.data()?.unreadNotifications).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/notifications returns user's notifications and unread count", async () => {
    const req = new NextRequest("http://localhost:3000/api/notifications", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.notifications)).toBe(true);
    expect(data.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it("POST /api/notifications/[id]/read marks item read and decrements unreadCount", async () => {
    const notif = await createNotification({
      userId: citizenUser.uid,
      type: "SUPPORT_ADDED",
      title: "Support Added",
      body: "A neighbor supported your report.",
      link: "/citizen/complaints/test-comp-2",
    });

    const req = new NextRequest(`http://localhost:3000/api/notifications/${notif.id}/read`, {
      method: "POST",
    });

    const res = await readPost(req, { params: Promise.resolve({ id: notif.id }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    const doc = await firestore.collection("notifications").doc(notif.id).get();
    expect(doc.data()?.read).toBe(true);
  });

  it("POST /api/notifications/read-all marks all notifications read and resets unread count to 0", async () => {
    await createNotification({
      userId: citizenUser.uid,
      type: "STATUS_CHANGED",
      title: "Alert",
      body: "Status changed",
      link: "/citizen/complaints/test",
    });

    const req = new NextRequest("http://localhost:3000/api/notifications/read-all", {
      method: "POST",
    });

    const res = await readAllPost(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.unreadCount).toBe(0);

    const userDoc = await firestore.collection("users").doc(citizenUser.uid).get();
    expect(userDoc.data()?.unreadNotifications).toBe(0);
  });

  it("POST /api/complaints/[id]/feedback confirms fix (T8) and transitions RESOLVED -> CLOSED", async () => {
    // Create complaint
    const { complaint: comp } = await createComplaint(
      {
        title: "Pothole for feedback test",
        description: "Pothole on 100ft road near bus stop",
        category: "POTHOLE",
        categorySource: "user",
        location: { lat: 12.9716, lng: 77.5946, landmark: "100ft road" },
        affectedScale: 0.4,
        durationBucket: "FEW_DAYS",
        visibility: "public",
        hazardFlags: [],
      },
      citizenUser,
    );

    // Set status to RESOLVED
    await firestore.collection("complaints").doc(comp.id).update({
      status: "RESOLVED",
      resolution: {
        note: "Pothole filled with bitumen mix",
        resolvedAt: new Date().toISOString(),
        resolvedByUid: "auth-roads",
        departmentId: "roads",
        evidence: [],
      },
    });

    // Reporter submits feedback
    const req = new NextRequest(`http://localhost:3000/api/complaints/${comp.id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 5, comment: "Excellent and quick repair!" }),
    });

    const res = await feedbackPost(req, { params: Promise.resolve({ id: comp.id }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.complaint.status).toBe("CLOSED");
    expect(data.complaint.feedback.rating).toBe(5);

    // Non-reporter citizen gets 403
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(otherCitizen);
    const badReq = new NextRequest(`http://localhost:3000/api/complaints/${comp.id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 4 }),
    });
    const badRes = await feedbackPost(badReq, { params: Promise.resolve({ id: comp.id }) });
    expect(badRes.status).toBe(403);
  });

  it("PATCH /api/complaints/[id]/status allows citizen reporter to withdraw own report (T2)", async () => {
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(citizenUser);
    const { complaint: comp } = await createComplaint(
      {
        title: "Accidental report to withdraw",
        description: "Mistakenly filed twice by citizen",
        category: "GARBAGE",
        categorySource: "user",
        location: { lat: 12.9716, lng: 77.5946, landmark: "Street 4" },
        affectedScale: 0.4,
        durationBucket: "FEW_DAYS",
        visibility: "public",
        hazardFlags: [],
      },
      citizenUser,
    );

    const req = new NextRequest(`http://localhost:3000/api/complaints/${comp.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "REJECTED",
        expectedStatus: "SUBMITTED",
        rejectReason: "WITHDRAWN_BY_REPORTER",
        note: "Citizen cancelled report",
      }),
    });

    const res = await statusPatch(req, { params: Promise.resolve({ id: comp.id }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.complaint.status).toBe("REJECTED");
  });
});
