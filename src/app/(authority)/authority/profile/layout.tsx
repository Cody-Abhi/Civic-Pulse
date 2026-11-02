import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Officer Profile",
  description: "View department assignment and configure alert thresholds for municipal queue monitoring.",
};

export default function AuthorityProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}

