import { NextResponse } from "next/server";
import { z } from "zod";
import { withApi, ApiError } from "@/server/http/with-api";
import { updateUserStatus } from "@/server/services/admin";

export const runtime = "nodejs";

const updateStatusSchema = z.object({
  status: z.enum(["active", "suspended"]),
  reason: z.string().optional().default("Administrative review"),
});

type UpdateStatusBody = z.infer<typeof updateStatusSchema>;

export const POST = withApi<UpdateStatusBody, { uid: string }>(
  {
    roles: ["admin"],
    schema: updateStatusSchema,
  },
  async (_req, { user, body, params }) => {
    const { uid } = params;
    try {
      const updated = await updateUserStatus(uid, body.status, body.reason, user!);
      return NextResponse.json({ success: true, user: updated });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "LAST_ADMIN") {
        throw new ApiError(409, "LAST_ADMIN", "Cannot suspend the last remaining active platform administrator.");
      }
      throw err;
    }
  },
);
