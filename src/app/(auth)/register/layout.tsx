import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create an account on CivicPulse to track municipal complaints and add your voice to neighborhood issues.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}

