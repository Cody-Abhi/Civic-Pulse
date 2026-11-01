import { NextResponse } from "next/server";
import { withApi, ApiError } from "@/server/http/with-api";
import { markNotificationRead } from "@/server/repositories/notifications.repo";

export const runtime = "nodejs";

export const POST = withApi<unknown, { id: string }>(
  {
    roles: ["citizen", "authority", "admin"],
  },
  async (_req, { user, params }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required.");
    }

    const { id } = params;
    const result = await markNotificationRead(id, user.uid);

    if (!result.success) {
      throw new ApiError(404, "NOT_FOUND", "Notification not found or access denied.");
    }

    return NextResponse.json({
      success: true,
      unreadCount: result.unreadCount,
    });
  },
);
