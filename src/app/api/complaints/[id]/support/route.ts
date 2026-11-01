import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { supportComplaint } from "@/server/services/complaints";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const user = await getSessionUser();
    const actorUid = user?.uid || `anon-supporter-${Date.now().toString(36)}`;

    const result = await supportComplaint(id, actorUid);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to add support";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
