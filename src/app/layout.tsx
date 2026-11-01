import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { BRAND_PRIMARY_HEX } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CivicPulse AI — Turning Citizen Voices into Intelligent City Action",
    template: "%s · CivicPulse AI",
  },
  description:
    "CivicPulse AI turns free-text civic reports into structured, located, prioritised records. Independent civic-tech prototype — not affiliated with any government body.",
  applicationName: "CivicPulse AI",
  authors: [{ name: "CivicPulse AI" }],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: BRAND_PRIMARY_HEX,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
