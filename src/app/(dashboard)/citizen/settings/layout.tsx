import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Citizen Settings",
  description: "Configure your privacy preferences, notification triggers, and data export options.",
};

export default function CitizenSettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

