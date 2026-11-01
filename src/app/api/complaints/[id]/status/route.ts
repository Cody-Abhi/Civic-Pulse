import { NextResponse } from "next/server";
import { z } from "zod";
import { withApi, ApiError } from "@/server/http/with-api";
import { getComplaint, updateComplaintStatus } from "@/server/services/complaints";
import { validateTransition } from "@/domain/transitions";

export const runtime = "nodejs";

const updateStatusSchema = z.object({
  status: z.enum([
    "SUBMITTED",
    "UNDER_REVIEW",
    "ASSIGNED",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
    "REJECTED",
    "REOPENED",
  ]),
  expectedStatus: z.enum([
    "SUBMITTED",
    "UNDER_REVIEW",
    "ASSIGNED",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
    "REJECTED",
    "REOPENED",
  ]).optional(),
  note: z.string().optional(),
  resolutionNote: z.string().optional(),
  rejectReason: z.enum([
    "DUPLICATE",
    "OUT_OF_JURISDICTION",
    "INSUFFICIENT_INFO",
    "SPAM",
    "WITHDRAWN_BY_REPORTER",
  ]).optional(),
  targetDepartmentId: z.string().optional(),
  assignedToUid: z.string().optional(),
  duplicateOfId: z.string().optional(),
});

type UpdateStatusBody = z.infer<typeof updateStatusSchema>;

export const PATCH = withApi<UpdateStatusBody, { id: string }>(
  {
    roles: ["citizen", "authority", "admin"],
    schema: updateStatusSchema,
  },
  async (_req, { user, body, params }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required.");
    }

    const { id } = params;
    const complaint = await getComplaint(id);
    if (!complaint) {
      throw new ApiError(404, "NOT_FOUND", "Complaint not found.");
    }

    // PRD §21.2: 404 for out-of-scope resources (authority in different department)
    if (user.role === "authority" && user.departmentId !== complaint.departmentId) {
      throw new ApiError(404, "NOT_FOUND", "Complaint not found.");
    }

    // Citizen can only modify their own reports
    if (user.role === "citizen" && complaint.reporterUid !== user.uid) {
      throw new ApiError(403, "FORBIDDEN", "You can only update your own complaints.");
    }

    // Lifecycle state machine validation (§21.5)
    const transitionResult = validateTransition(
      {
        uid: user.uid,
        role: user.role,
        departmentId: user.departmentId,
      },
      {
        status: complaint.status,
        departmentId: complaint.departmentId,
        reporterUid: complaint.reporterUid,
        reopenCount: complaint.reopenCount || 0,
        resolvedAtMs: complaint.resolution?.resolvedAt
          ? new Date(complaint.resolution.resolvedAt).getTime()
          : null,
        visibility: complaint.visibility,
      },
      {
        to: body.status,
        nowMs: Date.now(),
        expectedStatus: body.expectedStatus,
        reason: body.rejectReason,
        note: body.note,
        resolutionNote: body.resolutionNote,
        reopenReason: body.note,
        targetDepartmentId: body.targetDepartmentId,
        assignedToUid: body.assignedToUid,
        duplicateOfId: body.duplicateOfId,
      },
    );

    if (!transitionResult.ok) {
      if (transitionResult.code === "STATUS_CONFLICT") {
        throw new ApiError(
          409,
          "INVALID_TRANSITION",
          transitionResult.message,
          { currentStatus: complaint.status, expectedStatus: body.expectedStatus },
        );
      }
      if (transitionResult.code === "FORBIDDEN") {
        throw new ApiError(403, "FORBIDDEN", transitionResult.message);
      }
      throw new ApiError(400, transitionResult.code, transitionResult.message);
    }

    const updated = await updateComplaintStatus(id, body.status, {
      note: body.note,
      resolutionNote: body.resolutionNote,
      rejectReason: body.rejectReason,
      actorUid: user.uid,
      actorName: user.displayName,
      actorRole: user.role,
    });

    return NextResponse.json({ success: true, complaint: updated });
  },
);
