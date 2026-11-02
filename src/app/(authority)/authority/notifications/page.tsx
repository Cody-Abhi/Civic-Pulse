import type { Metadata } from "next";
import { NotificationCenter } from "@/components/notifications/notification-center";

export const metadata: Metadata = {
  title: "Department Notifications",
  description: "Real-time alerts for queue dispatches, SLA breach risks, and citizen escalations.",
};

export default function AuthorityNotificationsPage() {
  return (
    <NotificationCenter
      title="Department Notifications"
      description="Real-time alerts for queue dispatches, SLA breach risks, and citizen escalations."
      role="authority"
      emptyTitle="No department alerts"
      emptyBody="No notifications registered for your department queue."
    />
  );
}
