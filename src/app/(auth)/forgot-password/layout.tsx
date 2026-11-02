import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your CivicPulse account password securely via email.",
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}

