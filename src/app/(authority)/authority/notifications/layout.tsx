import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Department Notifications",
  description: "Real-time dispatch alerts and SLA breach risk notifications for municipal authority personnel.",
};

export default function AuthorityNotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

