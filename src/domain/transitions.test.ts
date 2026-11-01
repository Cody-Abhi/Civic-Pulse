import { describe, it, expect } from "vitest";
import {
  validateTransition,
  allowedTransitions,
  type TransitionActor,
  type TransitionComplaint,
  type TransitionRequest,
} from "./transitions";

const NOW = Date.UTC(2026, 10, 5, 6, 0, 0);
const HOUR = 3_600_000;

const authority: TransitionActor = { uid: "auth1", role: "authority", departmentId: "roads" };
const otherDept: TransitionActor = { uid: "auth2", role: "authority", departmentId: "swm" };
const admin: TransitionActor = { uid: "admin1", role: "admin", departmentId: null };
const reporter: TransitionActor = { uid: "cit1", role: "citizen", departmentId: null };

function complaint(o: Partial<TransitionComplaint> = {}): TransitionComplaint {
  return {
    status: "SUBMITTED",
    departmentId: "roads",
    reporterUid: "cit1",
    reopenCount: 0,
    resolvedAtMs: null,
    visibility: "public",
    ...o,
  };
}
function req(o: Partial<TransitionRequest> & { to: TransitionRequest["to"] }): TransitionRequest {
  return { nowMs: NOW, ...o };
}

describe("validateTransition — actor & dept scoping", () => {
  it("T1 authority in same dept may review", () => {
    const r = validateTransition(authority, complaint(), req({ to: "UNDER_REVIEW" }));
    expect(r.ok).toBe(true);
  });

  it("T1 authority in other dept is forbidden", () => {
    const r = validateTransition(otherDept, complaint(), req({ to: "UNDER_REVIEW" }));
    expect(r).toMatchObject({ ok: false, code: "FORBIDDEN" });
  });

  it("citizen cannot review", () => {
    const r = validateTransition(reporter, complaint(), req({ to: "UNDER_REVIEW" }));
    expect(r).toMatchObject({ ok: false, code: "FORBIDDEN" });
  });

  it("rejects an invalid transition (SUBMITTED → RESOLVED)", () => {
    const r = validateTransition(authority, complaint(), req({ to: "RESOLVED" }));
    expect(r).toMatchObject({ ok: false, code: "INVALID_TRANSITION" });
  });
});

describe("optimistic concurrency", () => {
  it("409 when expectedStatus mismatches", () => {
    const r = validateTransition(
      authority,
      complaint({ status: "SUBMITTED" }),
      req({ to: "UNDER_REVIEW", expectedStatus: "ASSIGNED" }),
    );
    expect(r).toMatchObject({ ok: false, code: "STATUS_CONFLICT" });
  });
});

describe("T2 reject / withdraw", () => {
  it("reporter may withdraw own submitted report", () => {
    const r = validateTransition(
      reporter,
      complaint(),
      req({ to: "REJECTED", reason: "WITHDRAWN_BY_REPORTER" }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.effects.rejectReason).toBe("WITHDRAWN_BY_REPORTER");
  });

  it("reporter cannot reject for other reasons", () => {
    const r = validateTransition(reporter, complaint(), req({ to: "REJECTED", reason: "SPAM" }));
    expect(r).toMatchObject({ ok: false, code: "FORBIDDEN" });
  });

  it("authority reject requires a reason", () => {
    const r = validateTransition(authority, complaint(), req({ to: "REJECTED" }));
    expect(r).toMatchObject({ ok: false, code: "VALIDATION" });
  });

  it("authority reject with non-duplicate reason requires a note", () => {
    const r = validateTransition(
      authority,
      complaint(),
      req({ to: "REJECTED", reason: "INSUFFICIENT_INFO" }),
    );
    expect(r).toMatchObject({ ok: false, code: "VALIDATION" });
  });

  it("SPAM reject flags public deletion", () => {
    const r = validateTransition(
      authority,
      complaint(),
      req({ to: "REJECTED", reason: "SPAM", note: "obvious spam" }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.effects.deletePublicIfSpam).toBe(true);
  });
});

describe("T7 resolve", () => {
  it("requires a 20–1000 char note", () => {
    const base = complaint({ status: "IN_PROGRESS" });
    expect(validateTransition(authority, base, req({ to: "RESOLVED", resolutionNote: "too short" })))
      .toMatchObject({ ok: false, code: "VALIDATION" });
    const ok = validateTransition(
      authority,
      base,
      req({ to: "RESOLVED", resolutionNote: "Pothole filled and road re-tarred." }),
    );
    expect(ok.ok).toBe(true);
  });
});

describe("T8 close", () => {
  it("reporter closes with feedback rating", () => {
    const r = validateTransition(
      reporter,
      complaint({ status: "RESOLVED", resolvedAtMs: NOW - HOUR }),
      req({ to: "CLOSED", feedbackRating: 4 }),
    );
    expect(r.ok).toBe(true);
  });
  it("reporter without rating fails validation", () => {
    const r = validateTransition(
      reporter,
      complaint({ status: "RESOLVED", resolvedAtMs: NOW - HOUR }),
      req({ to: "CLOSED" }),
    );
    expect(r).toMatchObject({ ok: false, code: "VALIDATION" });
  });
  it("admin may only close after 7 days", () => {
    const fresh = validateTransition(
      admin,
      complaint({ status: "RESOLVED", resolvedAtMs: NOW - HOUR }),
      req({ to: "CLOSED" }),
    );
    expect(fresh.ok).toBe(false);
    const old = validateTransition(
      admin,
      complaint({ status: "RESOLVED", resolvedAtMs: NOW - 8 * 24 * HOUR }),
      req({ to: "CLOSED" }),
    );
    expect(old.ok).toBe(true);
  });
});

describe("T9 reopen", () => {
  const resolvedRecently = complaint({ status: "RESOLVED", resolvedAtMs: NOW - 2 * 24 * HOUR });

  it("reporter reopens within window with reason", () => {
    const r = validateTransition(
      reporter,
      resolvedRecently,
      req({ to: "REOPENED", reopenReason: "The pothole is back after rain." }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.effects.resetSla).toBe(true);
  });

  it("window expired after 7 days", () => {
    const r = validateTransition(
      reporter,
      complaint({ status: "RESOLVED", resolvedAtMs: NOW - 8 * 24 * HOUR }),
      req({ to: "REOPENED", reopenReason: "still broken again" }),
    );
    expect(r).toMatchObject({ ok: false, code: "REOPEN_WINDOW_EXPIRED" });
  });

  it("limit reached after 2 reopens", () => {
    const r = validateTransition(
      reporter,
      complaint({ status: "RESOLVED", resolvedAtMs: NOW - HOUR, reopenCount: 2 }),
      req({ to: "REOPENED", reopenReason: "still broken again" }),
    );
    expect(r).toMatchObject({ ok: false, code: "REOPEN_LIMIT" });
  });

  it("non-reporter cannot reopen", () => {
    const r = validateTransition(
      authority,
      resolvedRecently,
      req({ to: "REOPENED", reopenReason: "still broken again" }),
    );
    expect(r).toMatchObject({ ok: false, code: "FORBIDDEN" });
  });
});

describe("allowedTransitions (UI rendering)", () => {
  it("authority on SUBMITTED sees review + reject", () => {
    const t = allowedTransitions(authority, complaint(), NOW);
    expect(t.sort()).toEqual(["REJECTED", "UNDER_REVIEW"]);
  });
  it("reporter on RESOLVED (in window) sees close + reopen", () => {
    const t = allowedTransitions(
      reporter,
      complaint({ status: "RESOLVED", resolvedAtMs: NOW - HOUR }),
      NOW,
    );
    expect(t.sort()).toEqual(["CLOSED", "REOPENED"]);
  });
});
