import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report New Issue",
  description: "File a civic complaint with MapLibre geolocation and generate a transparent 7-factor priority receipt.",
};

export default function NewComplaintLayout({ children }: { children: React.ReactNode }) {
  return children;
}

