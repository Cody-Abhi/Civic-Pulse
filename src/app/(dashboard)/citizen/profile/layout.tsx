import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Citizen Profile",
  description: "Manage your citizen profile, display name, and registered home ward in Bengaluru.",
};

export default function CitizenProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}

