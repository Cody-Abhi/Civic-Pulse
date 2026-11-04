import "server-only";
import type {
  Complaint,
  ComplaintActivity,
  ComplaintStatus,
  RejectReason,
  Role,
  Severity,
  WardSummary,
} from "@/domain/types";
import type { SessionUser } from "@/server/auth/session";
import * as complaintsRepo from "@/server/repositories/complaints.repo";
import * as metricsRepo from "@/server/repositories/metrics.repo";

import {
  createComplaintSchema,
  type CreateComplaintInput,
} from "@/domain/schemas";
import type { ListComplaintsOptions } from "@/server/repositories/complaints.repo";

export {
  createComplaintSchema,
  type CreateComplaintInput,
  type ListComplaintsOptions,
};

/**
 * Returns all complaints from Firestore repository.
 */
export async function getComplaints(): Promise<Complaint[]> {
  return complaintsRepo.listComplaints({ limit: 1000 });
}

/**
 * Returns live ward stats computed from Firestore.
 */
export async function getWardStats(): Promise<WardSummary[]> {
  return metricsRepo.getWardStats();
}

/**
 * Returns aggregate city metrics totals from Firestore.
 */
export async function getCityMetrics() {
  return metricsRepo.getCityMetrics();
}

/**
 * Creates a complaint through transaction (§25.3) in Firestore.
 */
export async function createComplaint(
  input: CreateComplaintInput,
  user: SessionUser,
  idempotencyKey?: string,
): Promise<{ complaint: Complaint; publicUrl: string | null }> {
  return complaintsRepo.createComplaint(input, user, idempotencyKey);
}

/**
 * Retrieves complaint by ID or Reference Code from Firestore.
 */
export async function getComplaint(refOrId: string): Promise<Complaint | null> {
  return complaintsRepo.getComplaintById(refOrId);
}

/**
 * Lists complaints with filtering & pagination from Firestore.
 */
export async function listComplaints(options: ListComplaintsOptions): Promise<Complaint[]> {
  return complaintsRepo.listComplaints(options);
}

/**
 * Adds citizen support (upvote / add my voice) to a complaint in Firestore.
 */
export async function supportComplaint(
  refOrId: string,
  user: SessionUser,
): Promise<{ success: boolean; supporterCount: number; complaint: Complaint }> {
  const result = await complaintsRepo.supportComplaint(refOrId, user);
  return {
    success: true,
    supporterCount: result.supporterCount,
    complaint: result.complaint,
  };
}

/**
 * Recomputes and persists updated priority score for a complaint in Firestore.
 */
export async function updateComplaintPriority(id: string): Promise<Complaint | null> {
  const c = await complaintsRepo.getComplaintById(id);
  if (!c) return null;
  const dummyActor: SessionUser = {
    uid: "system",
    email: "system@civicpulse.org",
    role: "admin",
    displayName: "System",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: null,
  };
  return complaintsRepo.adjustComplaintPriority(id, 0, "System recalculation", dummyActor);
}

/**
 * Updates complaint lifecycle status with activity logging in Firestore transaction.
 */
export async function updateComplaintStatus(
  refOrId: string,
  newStatus: ComplaintStatus,
  options?: {
    note?: string | undefined;
    resolutionNote?: string | undefined;
    expectedStatus?: ComplaintStatus | undefined;
    departmentId?: string | undefined;
    assignedToUid?: string | null | undefined;
    rejectReason?: RejectReason | undefined;
    actorUid?: string | undefined;
    actorName?: string | undefined;
    actorRole?: Role | undefined;
  },
): Promise<Complaint> {
  const c = await complaintsRepo.getComplaintById(refOrId);
  if (!c) throw new Error("Complaint not found");

  const expectedStatus = options?.expectedStatus || c.status;
  return complaintsRepo.transitionComplaint(c.id, {
    to: newStatus,
    expectedStatus,
    note: options?.note,
    resolutionNote: options?.resolutionNote,
    departmentId: options?.departmentId,
    assignedToUid: options?.assignedToUid,
    rejectReason: options?.rejectReason,
    actorUid: options?.actorUid || "system",
    actorName: options?.actorName || "Municipal Authority",
    actorRole: options?.actorRole || "authority",
  });
}

/**
 * Updates authority verified severity (1-5) and recalculates priority score.
 */
export async function setVerifiedSeverity(
  refOrId: string,
  severity: Severity,
  actor: SessionUser,
): Promise<Complaint> {
  return complaintsRepo.setVerifiedSeverity(refOrId, severity, actor);
}

/**
 * Adjusts complaint priority score by ±15 points with mandatory rationale.
 */
export async function adjustComplaintPriority(
  refOrId: string,
  adjustment: number,
  rationale: string,
  actor: SessionUser,
): Promise<Complaint> {
  return complaintsRepo.adjustComplaintPriority(refOrId, adjustment, rationale, actor);
}

/**
 * Returns activity log for a complaint from Firestore.
 */
export async function getComplaintActivities(complaintId: string): Promise<ComplaintActivity[]> {
  return complaintsRepo.getComplaintActivities(complaintId);
}
