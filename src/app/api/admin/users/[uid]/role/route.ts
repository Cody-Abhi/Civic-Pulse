import { NextResponse } from "next/server";
import { z } from "zod";
import { withApi, ApiError } from "@/server/http/with-api";
import { updateUserRole } from "@/server/services/admin";
import { ROLES, type Role } from "@/domain/schemas";

export const runtime = "nodejs";

const updateRoleSchema = z.object({
  role: z.enum(ROLES),
  departmentId: z.string().nullable().optional(),
});

type UpdateRoleBody = z.infer<typeof updateRoleSchema>;

export const POST = withApi<UpdateRoleBody, { uid: string }>(
  {
    roles: ["admin"],
    schema: updateRoleSchema,
  },
  async (_req, { user, body, params }) => {
    const { uid } = params;
    try {
      const updated = await updateUserRole(uid, body.role as Role, body.departmentId || null, user!);
      return NextResponse.json({ success: true, user: updated });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "LAST_ADMIN") {
        throw new ApiError(409, "LAST_ADMIN", "Cannot demote the last remaining active platform administrator.");
      }
      throw err;
    }
  },
);
