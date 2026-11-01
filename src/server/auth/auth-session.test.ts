import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/server/clients/firebase-admin";

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

import { POST, DELETE } from "@/app/api/auth/session/route";

describe("POST /api/auth/session & Session Exchange (§UI-03, §UI-04, §21.1)", () => {
  const auth = getAdminAuth();
  const firestore = getAdminFirestore();

  beforeEach(async () => {
    // Reset any test-specific documents if needed
  });

  it("returns 400 when idToken is missing or invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("VALIDATION_FAILED");
  });

  it("successfully creates a session and auto-provisions citizen user document", async () => {
    // Create a temporary user in the auth emulator
    const tempEmail = `new-citizen-${Date.now()}@example.com`;
    const userRecord = await auth.createUser({
      email: tempEmail,
      displayName: "Test Citizen",
      emailVerified: true,
    });

    // Generate a custom token, exchange for ID token via Auth emulator REST API
    const customToken = await auth.createCustomToken(userRecord.uid);
    const apiKey = "AIzaSyBBe5WmyPGkD6BRrNKMJFrOP0gmhsJ9IY4";
    const tokenRes = await fetch(
      `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      },
    );
    const tokenData = await tokenRes.json();
    const idToken = tokenData.idToken;

    const req = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.role).toBe("citizen");
    expect(data.home).toBe("/citizen/dashboard");

    // Check user was auto-provisioned in Firestore
    const userDoc = await firestore.collection("users").doc(userRecord.uid).get();
    expect(userDoc.exists).toBe(true);
    expect(userDoc.data()?.email).toBe(tempEmail);
    expect(userDoc.data()?.role).toBe("citizen");

    // Clean up
    await auth.deleteUser(userRecord.uid);
    await firestore.collection("users").doc(userRecord.uid).delete();
  });

  it("blocks open-redirect attempts (?next=https://evil.com) and falls back to role home", async () => {
    const tempEmail = `redirect-test-${Date.now()}@example.com`;
    const userRecord = await auth.createUser({
      email: tempEmail,
      displayName: "Redirect Citizen",
      emailVerified: true,
    });

    const customToken = await auth.createCustomToken(userRecord.uid);
    const apiKey = "AIzaSyBBe5WmyPGkD6BRrNKMJFrOP0gmhsJ9IY4";
    const tokenRes = await fetch(
      `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      },
    );
    const tokenData = await tokenRes.json();
    const idToken = tokenData.idToken;

    // Pass evil redirect
    const req = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, next: "https://evil.com/phish" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.home).toBe("/citizen/dashboard"); // Blocked!

    // Pass safe local redirect
    const safeReq = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, next: "/citizen/complaints/new" }),
    });

    const safeRes = await POST(safeReq);
    expect(safeRes.status).toBe(200);
    const safeData = await safeRes.json();
    expect(safeData.home).toBe("/citizen/complaints/new"); // Allowed!

    // Clean up
    await auth.deleteUser(userRecord.uid);
    await firestore.collection("users").doc(userRecord.uid).delete();
  });

  it("rejects suspended users with 403 ACCOUNT_SUSPENDED", async () => {
    const suspendedEmail = `suspended-${Date.now()}@example.com`;
    const userRecord = await auth.createUser({
      email: suspendedEmail,
      displayName: "Suspended User",
      emailVerified: true,
    });

    // Mark as suspended in Firestore
    await firestore.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: suspendedEmail,
      displayName: "Suspended User",
      role: "citizen",
      status: "suspended",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const customToken = await auth.createCustomToken(userRecord.uid);
    const apiKey = "AIzaSyBBe5WmyPGkD6BRrNKMJFrOP0gmhsJ9IY4";
    const tokenRes = await fetch(
      `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      },
    );
    const tokenData = await tokenRes.json();
    const idToken = tokenData.idToken;

    const req = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error.code).toBe("ACCOUNT_SUSPENDED");

    // Clean up
    await auth.deleteUser(userRecord.uid);
    await firestore.collection("users").doc(userRecord.uid).delete();
  });

  it("DELETE /api/auth/session successfully terminates session", async () => {
    const res = await DELETE();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});
