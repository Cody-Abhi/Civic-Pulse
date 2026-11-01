import { NextResponse } from "next/server";
import { withApi, ApiError } from "@/server/http/with-api";
import { markAllNotificationsRead } from "@/server/repositories/notifications.repo";

export const runtime = "nodejs";

export const POST = withApi(
  {
    roles: ["citizen", "authority", "admin"],
  },
  async (_req, { user }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required.");
    }

    await markAllNotificationsRead(user.uid);

    return NextResponse.json({
      success: true,
      unreadCount: 0,
    });
  },
);
