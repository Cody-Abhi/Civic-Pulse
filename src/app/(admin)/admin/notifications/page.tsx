import type { Metadata } from "next";
import { NotificationCenter } from "@/components/notifications/notification-center";

export const metadata: Metadata = {
  title: "Admin Notifications",
  description: "Platform governance and system alerts for administrators.",
};

export default function AdminNotificationsPage() {
  return (
    <NotificationCenter
      title="Governance & Platform Alerts"
      description="Platform-wide notifications for department SLA breaches, AI health telemetry anomalies, and administrative audits."
      role="admin"
      emptyTitle="No governance alerts"
      emptyBody="No system alerts currently registered for platform administration."
    />
  );
}
