import { NextResponse } from "next/server";
import { z } from "zod";
import { withApi } from "@/server/http/with-api";
import { getSystemSettings, updateSystemSettings } from "@/server/services/admin";
import type { SystemSettings } from "@/domain/types";

export const runtime = "nodejs";

export const GET = withApi(
  {
    roles: ["admin"],
  },
  async () => {
    return NextResponse.json(getSystemSettings());
  },
);

const updateSettingsSchema = z.object({
  section: z.string(),
  values: z.unknown(),
});

type UpdateSettingsBody = z.infer<typeof updateSettingsSchema>;

export const PATCH = withApi<UpdateSettingsBody>(
  {
    roles: ["admin"],
    schema: updateSettingsSchema,
  },
  async (_req, { user, body }) => {
    const updated = updateSystemSettings(body.section as keyof SystemSettings, body.values, user!);
    return NextResponse.json({ success: true, settings: updated });
  },
);
