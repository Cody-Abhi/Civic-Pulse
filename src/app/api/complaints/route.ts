import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { createComplaint, listComplaints, createComplaintSchema } from "@/server/services/complaints";
import type { ComplaintCategory } from "@/domain/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to submit complaint" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = createComplaintSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { complaint, publicUrl } = await createComplaint(parsed.data, user);

    return NextResponse.json(
      {
        id: complaint.id,
        ref: complaint.ref,
        status: complaint.status,
        priority: complaint.priority,
        publicUrl,
        duplicates: [],
      },
      { status: 201 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") as ComplaintCategory | null;
    const departmentId = url.searchParams.get("departmentId") || undefined;
    const isPublicOnly = url.searchParams.get("public") === "true";
    const userOnly = url.searchParams.get("mine") === "true";

    const user = await getSessionUser();
    const userId = userOnly && user ? user.uid : undefined;

    const complaints = await listComplaints({
      category: category || undefined,
      departmentId,
      isPublicOnly,
      userId,
      limit: 100,
    });

    return NextResponse.json({ complaints, total: complaints.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve complaints";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
