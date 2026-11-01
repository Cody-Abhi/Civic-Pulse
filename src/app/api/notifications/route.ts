import { NextResponse } from "next/server";
import { withApi, ApiError } from "@/server/http/with-api";
import { listUserNotifications } from "@/server/repositories/notifications.repo";

export const runtime = "nodejs";

export const GET = withApi(
  {
    roles: ["citizen", "authority", "admin"],
  },
  async (_req, { user }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required.");
    }

    const { notifications, unreadCount } = await listUserNotifications(user.uid);
    return NextResponse.json({
      notifications,
      unreadCount,
    });
  },
);
