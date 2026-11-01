import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { updateComplaintStatus } from "@/server/services/complaints";
import type { ComplaintStatus, RejectReason } from "@/domain/types";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const user = await getSessionUser();
    const json = await req.json();

    const { status, note, resolutionNote, rejectReason } = json as {
      status: ComplaintStatus;
      note?: string;
      resolutionNote?: string;
      rejectReason?: RejectReason;
    };

    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const updated = await updateComplaintStatus(id, status, {
      note,
      resolutionNote,
      rejectReason,
      actorUid: user?.uid || "authority-agent",
      actorName: user?.displayName || "Municipal Engineer",
      actorRole: user?.role || "authority",
    });

    return NextResponse.json({ success: true, complaint: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update complaint status";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
