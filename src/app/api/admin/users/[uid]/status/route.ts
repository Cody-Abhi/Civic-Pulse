import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { updateUserStatus } from "@/server/services/admin";

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
    const body = (await request.json()) as { status: "active" | "suspended"; reason: string };
    const updated = updateUserStatus(uid, body.status, body.reason || "Administrative review", user);
    return NextResponse.json({ success: true, user: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "LAST_ADMIN") {
      return NextResponse.json(
        { error: "Cannot suspend the last remaining active platform administrator." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
