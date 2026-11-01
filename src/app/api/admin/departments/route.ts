import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { getAdminDepartments, updateDepartment } from "@/server/services/admin";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const depts = await getAdminDepartments();
  return NextResponse.json(depts);
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const updated = await updateDepartment(body.id, body, user);
    return NextResponse.json({ success: true, department: updated });
  } catch (err: unknown) {
    const errObj = err as { name?: string; message?: string };
    if (errObj.name === "DEPARTMENT_HAS_OPEN_COMPLAINTS") {
      return NextResponse.json({ error: errObj.message }, { status: 409 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
