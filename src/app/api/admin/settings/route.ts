import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { getSystemSettings, updateSystemSettings } from "@/server/services/admin";
import type { SystemSettings } from "@/domain/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json(getSystemSettings());
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { section: keyof SystemSettings; values: unknown };
    const updated = updateSystemSettings(body.section, body.values, user);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

