import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import type { SessionUser } from "@/server/auth/session";

describe("Bulk Transition Route Handler TDZ & Runtime Evaluation", () => {
  it("can be imported without ReferenceError or TDZ errors during module evaluation", async () => {
    // Dynamic import to verify module evaluation directly
    const routeModule = await import("@/app/api/complaints/bulk-transition/route");
    expect(routeModule).toBeDefined();
    expect(typeof routeModule.POST).toBe("function");
    expect(routeModule.runtime).toBe("nodejs");
    expect(routeModule.dynamic).toBe("force-dynamic");
  });

  it("executes POST handler with unauthenticated request without TDZ error", async () => {
    const { POST } = await import("@/app/api/complaints/bulk-transition/route");
    const sessionModule = await import("@/server/auth/session");
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/complaints/bulk-transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ["comp-1"], to: "UNDER_REVIEW" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.code).toBe("UNAUTHENTICATED");
  });

  it("executes POST handler with schema validation without TDZ error", async () => {
    const { POST } = await import("@/app/api/complaints/bulk-transition/route");
    const sessionModule = await import("@/server/auth/session");

    const authorityUser: SessionUser = {
      uid: "test-authority-1",
      email: "authority@civicpulse.org",
      displayName: "Authority Officer",
      role: "authority",
      departmentId: "roads",
      status: "active",
      emailVerified: true,
      homeWardId: "ward-150-bellandur",
    };
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(authorityUser);

    // Empty ids array violates .min(1)
    const req = new NextRequest("http://localhost:3000/api/complaints/bulk-transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [], to: "UNDER_REVIEW" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("VALIDATION_FAILED");
  });

  it("executes POST handler with valid transition without TDZ error", async () => {
    const { POST } = await import("@/app/api/complaints/bulk-transition/route");
    const sessionModule = await import("@/server/auth/session");
    const repoModule = await import("@/server/repositories/complaints.repo");

    const authorityUser: SessionUser = {
      uid: "test-authority-1",
      email: "authority@civicpulse.org",
      displayName: "Authority Officer",
      role: "authority",
      departmentId: "roads",
      status: "active",
      emailVerified: true,
      homeWardId: "ward-150-bellandur",
    };
    vi.spyOn(sessionModule, "getSessionUser").mockResolvedValue(authorityUser);

    const transitionSpy = vi
      .spyOn(repoModule, "transitionComplaint")
      .mockResolvedValue({} as never);

    const req = new NextRequest("http://localhost:3000/api/complaints/bulk-transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: ["comp-1", "comp-2"],
        to: "UNDER_REVIEW",
        expectedStatus: "SUBMITTED",
        note: "Bulk review initiated",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total).toBe(2);
    expect(data.updated).toBe(2);
    expect(data.skipped).toBe(0);
    expect(data.results).toEqual([
      { id: "comp-1", success: true },
      { id: "comp-2", success: true },
    ]);
    expect(transitionSpy).toHaveBeenCalledTimes(2);
  });
});
