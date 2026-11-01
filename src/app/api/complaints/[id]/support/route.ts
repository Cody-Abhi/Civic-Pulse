import { NextResponse } from "next/server";
import { withApi, ApiError } from "@/server/http/with-api";
import { supportComplaint } from "@/server/services/complaints";

export const runtime = "nodejs";

export const POST = withApi<unknown, { id: string }>(
  {},
  async (_req, { user, params }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required to support a complaint.");
    }

    const { id } = params;
    const result = await supportComplaint(id, user.uid);
    return NextResponse.json(result);
  },
);
