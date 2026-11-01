import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { setAiPaused } from "@/server/services/admin";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { paused: boolean };
    const res = setAiPaused(Boolean(body.paused), user);
    return NextResponse.json({ success: true, ...res });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
