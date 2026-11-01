import { NextResponse } from "next/server";
import { z } from "zod";
import { withApi, ApiError } from "@/server/http/with-api";
import { getComplaint } from "@/server/services/complaints";
import { transitionComplaint } from "@/server/repositories/complaints.repo";

export const runtime = "nodejs";

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

type FeedbackBody = z.infer<typeof feedbackSchema>;

export const POST = withApi<FeedbackBody, { id: string }>(
  {
    roles: ["citizen", "admin"],
    schema: feedbackSchema,
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

    if (user.role === "citizen" && complaint.reporterUid !== user.uid) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Only the complaint reporter can submit resolution feedback.",
      );
    }

    if (complaint.status !== "RESOLVED") {
      throw new ApiError(
        409,
        "INVALID_TRANSITION",
        `Cannot submit feedback on a complaint with status ${complaint.status}. Expected RESOLVED.`,
      );
    }

    const updated = await transitionComplaint(id, {
      to: "CLOSED",
      expectedStatus: "RESOLVED",
      feedbackRating: body.rating,
      feedbackComment: body.comment,
      actorUid: user.uid,
      actorName: user.displayName,
      actorRole: user.role,
    });

    return NextResponse.json({ success: true, complaint: updated });
  },
);

