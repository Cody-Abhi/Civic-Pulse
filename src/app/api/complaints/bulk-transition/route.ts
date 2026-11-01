import { NextResponse } from "next/server";
import { withApi, ApiError } from "@/server/http/with-api";
import { transitionComplaint } from "@/server/repositories/complaints.repo";
import { statusSchema } from "@/domain/schemas";
import type { ComplaintStatus } from "@/domain/types";
import { z } from "zod";

export const runtime = "nodejs";

const bulkTransitionSchema = z.object({
  ids: z.array(z.string()).min(1).max(50),
  to: statusSchema,
  expectedStatus: statusSchema.optional(),
  note: z.string().max(500).optional(),
  departmentId: z.string().optional(),
  assignedToUid: z.string().optional(),
});

type BulkTransitionInput = z.infer<typeof bulkTransitionSchema>;

export const POST = withApi<BulkTransitionInput>(
  {
    schema: bulkTransitionSchema,
    roles: ["authority", "admin"],
  },
  async (_req, { user, body }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
    }

    const results: Array<{ id: string; success: boolean; reason?: string }> = [];
    let updated = 0;
    let skipped = 0;

    for (const id of body.ids) {
      try {
        await transitionComplaint(id, {
          to: body.to as ComplaintStatus,
          expectedStatus: body.expectedStatus || "SUBMITTED",
          actorUid: user.uid,
          actorName: user.displayName,
          actorRole: user.role,
          note: body.note,
          departmentId: body.departmentId,
          assignedToUid: body.assignedToUid,
        });
        results.push({ id, success: true });
        updated++;
      } catch (err: unknown) {
        skipped++;
        const message = err instanceof Error ? err.message : "Transition failed";
        results.push({ id, success: false, reason: message });
      }
    }

    return NextResponse.json({
      total: body.ids.length,
      updated,
      skipped,
      results,
    });
  },
);
