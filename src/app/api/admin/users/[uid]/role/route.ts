import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { updateUserRole } from "@/server/services/admin";
import type { Role } from "@/domain/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ uid: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { uid } = await context.params;

  try {
    const body = (await request.json()) as { role: Role; departmentId?: string | null };
    const updated = updateUserRole(uid, body.role, body.departmentId || null, user);
    return NextResponse.json({ success: true, user: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "LAST_ADMIN") {
      return NextResponse.json(
        { error: "Cannot demote the last remaining active platform administrator." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

