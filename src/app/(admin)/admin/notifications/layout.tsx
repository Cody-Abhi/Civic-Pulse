import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Governance & System Alerts",
  description: "Platform-wide alerts for department SLA breaches, AI health telemetry anomalies, and administrative audits.",
};

export default function AdminNotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

