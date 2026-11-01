import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { adjustComplaintPriority, setVerifiedSeverity } from "@/server/services/complaints";
import type { Severity } from "@/domain/types";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const user = await getSessionUser();
    const json = await req.json();

    const { adjustment, rationale, verifiedSeverity } = json as {
      adjustment?: number;
      rationale?: string;
      verifiedSeverity?: number;
    };

    if (typeof verifiedSeverity === "number") {
      const updated = await setVerifiedSeverity(
        id,
        verifiedSeverity as Severity,
        user?.uid || "authority-agent",
      );
      return NextResponse.json({ success: true, complaint: updated });
    }

    if (typeof adjustment !== "number" || !rationale) {
      return NextResponse.json(
        { error: "adjustment (number between -15 and +15) and rationale are required" },
        { status: 400 },
      );
    }

    const updated = await adjustComplaintPriority(
      id,
      adjustment,
      rationale,
      user?.uid || "authority-agent",
    );

    return NextResponse.json({ success: true, complaint: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to adjust complaint priority";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
