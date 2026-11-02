import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to CivicPulse to file civic reports, follow community issues, or manage municipal queues.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

