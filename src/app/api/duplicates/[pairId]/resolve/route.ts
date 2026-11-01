import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { resolveDuplicatePair } from "@/server/services/ai";
import { z } from "zod";

export const runtime = "nodejs";

const resolveSchema = z.object({
  decision: z.enum(["CONFIRM", "DISMISS"]),
  rootId: z.string().optional(),
  note: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pairId: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "authority" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { pairId } = await params;
    const json = await req.json().catch(() => ({}));
    const parsed = resolveSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const result = await resolveDuplicatePair(
      pairId,
      parsed.data.decision,
      parsed.data.rootId,
      parsed.data.note,
      user,
    );

    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to resolve duplicate";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
