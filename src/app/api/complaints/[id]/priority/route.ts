import { NextResponse } from "next/server";
import { z } from "zod";
import { withApi, ApiError } from "@/server/http/with-api";
import {
  getComplaint,
  adjustComplaintPriority,
  setVerifiedSeverity,
} from "@/server/services/complaints";
import type { Severity } from "@/domain/types";

export const runtime = "nodejs";

const priorityAdjustmentSchema = z.object({
  adjustment: z.number().min(-15).max(15).optional(),
  rationale: z.string().min(5).max(500).optional(),
  verifiedSeverity: z.number().int().min(1).max(5).optional(),
});

type PriorityAdjustmentBody = z.infer<typeof priorityAdjustmentSchema>;

export const PATCH = withApi<PriorityAdjustmentBody, { id: string }>(
  {
    roles: ["authority", "admin"],
    schema: priorityAdjustmentSchema,
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

    if (user.role === "authority" && user.departmentId !== complaint.departmentId) {
      throw new ApiError(404, "NOT_FOUND", "Complaint not found.");
    }

    if (typeof body.verifiedSeverity === "number") {
      const updated = await setVerifiedSeverity(
        id,
        body.verifiedSeverity as Severity,
        user.uid,
      );
      return NextResponse.json({ success: true, complaint: updated });
    }

    if (typeof body.adjustment !== "number" || !body.rationale) {
      throw new ApiError(
        400,
        "VALIDATION_FAILED",
        "adjustment (-15 to +15) and rationale (min 5 chars) are required for supervisor override.",
      );
    }

    const updated = await adjustComplaintPriority(
      id,
      body.adjustment,
      body.rationale,
      user.uid,
    );

    return NextResponse.json({ success: true, complaint: updated });
  },
);
