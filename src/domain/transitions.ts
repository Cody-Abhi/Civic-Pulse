import type { ComplaintStatus, RejectReason, Role } from "./types";

/**
 * Complaint lifecycle state machine (§21.5, PRD-FR-020) — defined once, pure.
 * Used by the API (authoritative) and the UI (to render only valid actions).
 */

export interface TransitionActor {
  uid: string;
  role: Role;
  departmentId: string | null;
}

export interface TransitionComplaint {
  status: ComplaintStatus;
  departmentId: string;
  reporterUid: string;
  reopenCount: number;
  resolvedAtMs: number | null;
  visibility: "public" | "private";
}

export interface TransitionRequest {
  to: ComplaintStatus;
  nowMs: number;
  expectedStatus?: ComplaintStatus;
  reason?: RejectReason;
  note?: string;
  targetDepartmentId?: string;
  assignedToUid?: string;
  duplicateOfId?: string;
  feedbackRating?: number;
  resolutionNote?: string;
  reopenReason?: string;
}

export type TransitionCode =
  | "INVALID_TRANSITION"
  | "FORBIDDEN"
  | "STATUS_CONFLICT"
  | "VALIDATION"
  | "REOPEN_LIMIT"
  | "REOPEN_WINDOW_EXPIRED"
  | "NOT_REPORTER";

export interface TransitionEffects {
  setStatus: ComplaintStatus;
  rejectReason?: RejectReason;
  performDuplicateLink?: boolean;
  performDuplicateUnlink?: boolean;
  assign?: boolean;
  transfer?: boolean;
  resetSla?: boolean;
  incrementReopen?: boolean;
  recomputePriority?: boolean;
  recordResolution?: boolean;
  recordFeedback?: boolean;
  restorePublic?: boolean;
  deletePublicIfSpam?: boolean;
}

export type TransitionResult =
  | { ok: true; from: ComplaintStatus; to: ComplaintStatus; effects: TransitionEffects }
  | { ok: false; code: TransitionCode; message: string };

const SEVEN_DAYS_MS = 7 * 24 * 3_600_000;

const fail = (code: TransitionCode, message: string): TransitionResult => ({
  ok: false,
  code,
  message,
});

const isAdmin = (a: TransitionActor) => a.role === "admin";
const isAuthSameDept = (a: TransitionActor, c: TransitionComplaint) =>
  a.role === "authority" && a.departmentId === c.departmentId;
const isReporter = (a: TransitionActor, c: TransitionComplaint) =>
  a.uid === c.reporterUid;

interface TransitionSpec {
  id: string;
  validate: (
    a: TransitionActor,
    c: TransitionComplaint,
    r: TransitionRequest,
  ) => TransitionResult;
}

const key = (from: ComplaintStatus, to: ComplaintStatus) => `${from}->${to}`;

function need(cond: boolean, message: string): TransitionResult | null {
  return cond ? null : fail("VALIDATION", message);
}

const SPECS: Record<string, TransitionSpec> = {
  [key("SUBMITTED", "UNDER_REVIEW")]: {
    id: "T1",
    validate: (a, c) =>
      isAdmin(a) || isAuthSameDept(a, c)
        ? { ok: true, from: "SUBMITTED", to: "UNDER_REVIEW", effects: { setStatus: "UNDER_REVIEW" } }
        : fail("FORBIDDEN", "Only the owning department or an admin can review."),
  },

  [key("SUBMITTED", "REJECTED")]: {
    id: "T2",
    validate: (a, c, r) => rejectValidate(a, c, r, "SUBMITTED"),
  },

  [key("UNDER_REVIEW", "ASSIGNED")]: {
    id: "T3",
    validate: (a, c, r) => assignValidate(a, c, r, "UNDER_REVIEW"),
  },

  [key("UNDER_REVIEW", "REJECTED")]: {
    id: "T4",
    validate: (a, c, r) => rejectValidate(a, c, r, "UNDER_REVIEW"),
  },

  [key("ASSIGNED", "ASSIGNED")]: {
    id: "T5",
    validate: (a, c, r) => {
      if (!(isAdmin(a) || isAuthSameDept(a, c)))
        return fail("FORBIDDEN", "Only the current department or an admin can transfer.");
      const v =
        need(!!r.targetDepartmentId && r.targetDepartmentId !== c.departmentId,
          "A different, active target department is required.") ??
        need((r.note?.trim().length ?? 0) >= 10 && (r.note?.trim().length ?? 0) <= 500,
          "A transfer note of 10–500 characters is required.");
      if (v) return v;
      return { ok: true, from: "ASSIGNED", to: "ASSIGNED", effects: { setStatus: "ASSIGNED", transfer: true } };
    },
  },

  [key("ASSIGNED", "IN_PROGRESS")]: {
    id: "T6",
    validate: (a, c) =>
      isAdmin(a) || isAuthSameDept(a, c)
        ? { ok: true, from: "ASSIGNED", to: "IN_PROGRESS", effects: { setStatus: "IN_PROGRESS" } }
        : fail("FORBIDDEN", "Only the owning department or an admin can start work."),
  },

  [key("IN_PROGRESS", "RESOLVED")]: {
    id: "T7",
    validate: (a, c, r) => {
      if (!(isAdmin(a) || isAuthSameDept(a, c)))
        return fail("FORBIDDEN", "Only the owning department or an admin can resolve.");
      const len = r.resolutionNote?.trim().length ?? 0;
      const v = need(len >= 20 && len <= 1000, "A resolution note of 20–1000 characters is required.");
      if (v) return v;
      return {
        ok: true,
        from: "IN_PROGRESS",
        to: "RESOLVED",
        effects: { setStatus: "RESOLVED", recordResolution: true },
      };
    },
  },

  [key("RESOLVED", "CLOSED")]: {
    id: "T8",
    validate: (a, c, r) => {
      if (isReporter(a, c)) {
        const rating = r.feedbackRating ?? 0;
        const v = need(
          Number.isInteger(rating) && rating >= 1 && rating <= 5,
          "A feedback rating of 1–5 is required to close.",
        );
        if (v) return v;
        return { ok: true, from: "RESOLVED", to: "CLOSED", effects: { setStatus: "CLOSED", recordFeedback: true } };
      }
      if (isAdmin(a)) {
        const old = c.resolvedAtMs !== null && r.nowMs - c.resolvedAtMs >= SEVEN_DAYS_MS;
        return old
          ? { ok: true, from: "RESOLVED", to: "CLOSED", effects: { setStatus: "CLOSED" } }
          : fail("STATUS_CONFLICT", "Admin may close only after 7 days; reporter closes via feedback.");
      }
      return fail("NOT_REPORTER", "Only the reporter (via feedback) or an admin can close.");
    },
  },

  [key("RESOLVED", "REOPENED")]: {
    id: "T9",
    validate: (a, c, r) => {
      if (!isReporter(a, c)) return fail("FORBIDDEN", "Only the reporter can reopen.");
      if (c.resolvedAtMs === null || r.nowMs - c.resolvedAtMs > SEVEN_DAYS_MS)
        return fail("REOPEN_WINDOW_EXPIRED", "The 7-day reopen window has passed.");
      if (c.reopenCount >= 2) return fail("REOPEN_LIMIT", "This report has already been reopened twice.");
      const len = r.reopenReason?.trim().length ?? 0;
      const v = need(len >= 10 && len <= 500, "A reason of 10–500 characters is required.");
      if (v) return v;
      return {
        ok: true,
        from: "RESOLVED",
        to: "REOPENED",
        effects: { setStatus: "REOPENED", incrementReopen: true, resetSla: true, recomputePriority: true },
      };
    },
  },

  [key("REOPENED", "ASSIGNED")]: {
    id: "T10",
    validate: (a, c, r) => assignValidate(a, c, r, "REOPENED"),
  },

  [key("REJECTED", "UNDER_REVIEW")]: {
    id: "T11",
    validate: (a, c, r) => {
      if (!isAdmin(a)) return fail("FORBIDDEN", "Only an admin can un-reject.");
      const len = r.note?.trim().length ?? 0;
      const v = need(len >= 1, "A note is required.");
      if (v) return v;
      return {
        ok: true,
        from: "REJECTED",
        to: "UNDER_REVIEW",
        effects: { setStatus: "UNDER_REVIEW", restorePublic: true, performDuplicateUnlink: true },
      };
    },
  },
};

function rejectValidate(
  a: TransitionActor,
  c: TransitionComplaint,
  r: TransitionRequest,
  from: ComplaintStatus,
): TransitionResult {
  const to: ComplaintStatus = "REJECTED";
  // Reporter may only withdraw their own submitted report.
  if (isReporter(a, c) && !isAdmin(a) && a.role === "citizen") {
    if (r.reason !== "WITHDRAWN_BY_REPORTER")
      return fail("FORBIDDEN", "A reporter can only withdraw their own report.");
    return { ok: true, from, to, effects: { setStatus: to, rejectReason: "WITHDRAWN_BY_REPORTER" } };
  }
  if (!(isAdmin(a) || isAuthSameDept(a, c)))
    return fail("FORBIDDEN", "Only the owning department or an admin can reject.");
  if (!r.reason) return fail("VALIDATION", "A reject reason is required.");
  const noteOptional = r.reason === "DUPLICATE" || r.reason === "WITHDRAWN_BY_REPORTER";
  if (!noteOptional && (r.note?.trim().length ?? 0) < 1)
    return fail("VALIDATION", "A note is required for this reason.");
  if (from === "UNDER_REVIEW" && r.reason === "DUPLICATE" && !r.duplicateOfId)
    return fail("VALIDATION", "duplicateOfId is required to reject as duplicate.");
  return {
    ok: true,
    from,
    to,
    effects: {
      setStatus: to,
      rejectReason: r.reason,
      performDuplicateLink: r.reason === "DUPLICATE",
      deletePublicIfSpam: r.reason === "SPAM",
    },
  };
}

function assignValidate(
  a: TransitionActor,
  c: TransitionComplaint,
  _r: TransitionRequest,
  from: ComplaintStatus,
): TransitionResult {
  if (!(isAdmin(a) || isAuthSameDept(a, c)))
    return fail("FORBIDDEN", "Only the owning department or an admin can assign.");
  return { ok: true, from, to: "ASSIGNED", effects: { setStatus: "ASSIGNED", assign: true } };
}

/** Validate a requested transition. Pure; the service applies the effects. */
export function validateTransition(
  actor: TransitionActor,
  complaint: TransitionComplaint,
  request: TransitionRequest,
): TransitionResult {
  const spec = SPECS[key(complaint.status, request.to)];
  if (!spec)
    return fail(
      "INVALID_TRANSITION",
      `No transition from ${complaint.status} to ${request.to}.`,
    );
  // Optimistic concurrency (§21.5): expectedStatus must match current.
  if (request.expectedStatus && request.expectedStatus !== complaint.status)
    return fail("STATUS_CONFLICT", "The complaint status changed; refresh and retry.");
  return spec.validate(actor, complaint, request);
}

/** Transitions available to an actor from the current state (for UI rendering). */
export function allowedTransitions(
  actor: TransitionActor,
  complaint: TransitionComplaint,
  nowMs: number,
): ComplaintStatus[] {
  const targets = new Set<ComplaintStatus>();
  for (const specKey of Object.keys(SPECS)) {
    const [from, to] = specKey.split("->") as [ComplaintStatus, ComplaintStatus];
    if (from !== complaint.status) continue;
    const res = validateTransition(actor, complaint, {
      to,
      nowMs,
      // Provide placeholder values so FORBIDDEN (not VALIDATION) is the gate.
      reason: "OUT_OF_JURISDICTION",
      note: "placeholder note for availability check",
      targetDepartmentId: "__other__",
      resolutionNote: "x".repeat(20),
      reopenReason: "x".repeat(10),
      feedbackRating: 5,
      duplicateOfId: "placeholder",
    });
    if (res.ok || (!res.ok && res.code !== "FORBIDDEN" && res.code !== "NOT_REPORTER"))
      targets.add(to);
  }
  return [...targets];
}
