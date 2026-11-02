import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getDemoCredentials } from "@/app/api/demo/credentials/route";
import { POST as postDemoReset } from "@/app/api/admin/demo/reset/route";
import * as adminService from "@/server/services/admin";
import * as sessionModule from "@/server/auth/session";
import type { SessionUser } from "@/server/auth/session";

describe("Milestone 6 (R6): Demo Credentials & Administration Security (PRD-§25.2, PRD-§36.2)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const citizenUser: SessionUser = {
    uid: "citizen-1",
    email: "citizen@civicpulse.local",
    displayName: "Citizen 1",
    role: "citizen",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: null,
  };

  const adminUser: SessionUser = {
    uid: "admin-1",
    email: "admin@civicpulse.local",
    displayName: "Admin 1",
    role: "admin",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: null,
  };

  describe("1. Public Demo Credentials Exposure Sanitization", () => {
    it("exposes only citizen and authority accounts publicly via API", async () => {
      const req = new NextRequest("http://localhost:3000/api/demo/credentials");
      const res = await getDemoCredentials(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("accounts");
      expect(Array.isArray(data.accounts)).toBe(true);

      const roles = data.accounts.map((acc: { role: string }) => acc.role);
      expect(roles).toContain("citizen");
      expect(roles).toContain("authority");
      expect(roles).not.toContain("admin");

      // Verify that no admin password or email is served
      const adminAcc = data.accounts.find((acc: { role: string }) => acc.role === "admin");
      expect(adminAcc).toBeUndefined();
    });
  });

  describe("2. Demo Reset Typed Confirmation & Role Enforcement", () => {
    it("rejects unauthenticated requests with 401", async () => {
      vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/admin/demo/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ confirmation: "RESET DEMO" }),
      });

      const res = await postDemoReset(req);
      expect(res.status).toBe(401);
    });

    it("rejects non-admin role with 403 Forbidden", async () => {
      vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(citizenUser);

      const req = new NextRequest("http://localhost:3000/api/admin/demo/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ confirmation: "RESET DEMO" }),
      });

      const res = await postDemoReset(req);
      expect(res.status).toBe(403);
    });

    it("rejects request missing confirmation body with 400 Bad Request", async () => {
      vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(adminUser);

      const req = new NextRequest("http://localhost:3000/api/admin/demo/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({}),
      });

      const res = await postDemoReset(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("rejects request with incorrect confirmation string with 400 Bad Request", async () => {
      vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(adminUser);

      const req = new NextRequest("http://localhost:3000/api/admin/demo/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ confirmation: "reset" }),
      });

      const res = await postDemoReset(req);
      expect(res.status).toBe(400);
    });

    it("accepts request with exact confirmation string 'RESET DEMO' and calls resetDemoData", async () => {
      vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(adminUser);
      const resetSpy = vi.spyOn(adminService, "resetDemoData").mockResolvedValue({
        success: true,
        message: "Reset complete",
        seededCount: 240,
      });

      const req = new NextRequest("http://localhost:3000/api/admin/demo/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ confirmation: "RESET DEMO" }),
      });

      const res = await postDemoReset(req);
      expect(res.status).toBe(200);
      expect(resetSpy).toHaveBeenCalledWith(adminUser);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.seededCount).toBe(240);
    });
  });
});

