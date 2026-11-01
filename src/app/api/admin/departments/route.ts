import { NextResponse } from "next/server";
import { z } from "zod";
import { withApi, ApiError } from "@/server/http/with-api";
import { getAdminDepartments, updateDepartment } from "@/server/services/admin";

export const runtime = "nodejs";

export const GET = withApi(
  {
    roles: ["admin"],
  },
  async () => {
    const depts = await getAdminDepartments();
    return NextResponse.json(depts);
  },
);

const updateDeptSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  code: z.string().optional(),
  active: z.boolean().optional(),
  slaHours: z.number().optional(),
  leadName: z.string().optional(),
  contactEmail: z.string().email().optional(),
});

type UpdateDeptBody = z.infer<typeof updateDeptSchema>;

export const PATCH = withApi<UpdateDeptBody>(
  {
    roles: ["admin"],
    schema: updateDeptSchema,
  },
  async (_req, { user, body }) => {
    try {
      const updates: { name?: string; description?: string; active?: boolean } = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.active !== undefined) updates.active = body.active;
      if (body.leadName !== undefined) updates.description = body.leadName;

      const updated = await updateDepartment(body.id, updates, user!);
      return NextResponse.json({ success: true, department: updated });
    } catch (err: unknown) {
      const errObj = err as { name?: string; message?: string };
      if (errObj.name === "DEPARTMENT_HAS_OPEN_COMPLAINTS") {
        throw new ApiError(409, "DEPARTMENT_HAS_OPEN_COMPLAINTS", errObj.message || "Department has open complaints.");
      }
      throw err;
    }
  },
);
