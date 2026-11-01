import { NextResponse } from "next/server";
import { withApi, ApiError } from "@/server/http/with-api";
import {
  createComplaint,
  listComplaints,
  createComplaintSchema,
  type CreateComplaintInput,
} from "@/server/services/complaints";
import type { ComplaintCategory } from "@/domain/schemas";

export const runtime = "nodejs";

export const POST = withApi<CreateComplaintInput>(
  {
    schema: createComplaintSchema,
  },
  async (_req, { user, body }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required to submit complaint.");
    }

    const { complaint, publicUrl } = await createComplaint(body, user);

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
  },
);

export const GET = withApi(
  {
    public: true,
  },
  async (req, { user }) => {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") as ComplaintCategory | null;
    const departmentId = url.searchParams.get("departmentId") || undefined;
    const wardId = url.searchParams.get("wardId") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const priorityBand = url.searchParams.get("priorityBand") || undefined;
    const search = url.searchParams.get("search") || undefined;
    const sortBy = (url.searchParams.get("sortBy") as "priority" | "recent" | "supported") || undefined;
    const isPublicOnly = url.searchParams.get("public") === "true";
    const userOnly = url.searchParams.get("mine") === "true";
    const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : 250;

    const userId = userOnly && user ? user.uid : undefined;

    const complaints = await listComplaints({
      category: category || undefined,
      departmentId,
      wardId,
      status,
      priorityBand,
      search,
      sortBy,
      isPublicOnly,
      userId,
      limit,
    });

    return NextResponse.json(complaints);
  },
);
