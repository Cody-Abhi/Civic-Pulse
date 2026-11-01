import { NextResponse } from "next/server";
import { withApi, ApiError } from "@/server/http/with-api";
import { generateGroundedInsights } from "@/server/services/ai";

export const runtime = "nodejs";

export const GET = withApi(
  {
    roles: ["authority", "admin"],
  },
  async (req, { user }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required.");
    }

    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") || "city:blr";

    // If authority, ensure scope doesn't cross into other departments
    if (user.role === "authority" && scope.startsWith("dept:")) {
      const dept = scope.replace("dept:", "");
      if (user.departmentId && user.departmentId !== dept) {
        throw new ApiError(403, "FORBIDDEN", "Authority cannot query insights for other departments.");
      }
    }

    const insights = await generateGroundedInsights(scope);
    return NextResponse.json({ insights }, { status: 200 });
  },
);
