import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Stay updated on your reported civic issues, status changes, and community reactions.",
};

export default function CitizenNotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

