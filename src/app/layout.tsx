import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { BRAND_PRIMARY_HEX } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "https://civicpulse.vercel.app"),
  title: {
    default: "CivicPulse — Transparent Civic Action",
    template: "%s · CivicPulse",
  },
  description:
    "CivicPulse AI turns free-text civic reports into structured, located, prioritised records with transparent 7-factor priority receipts. Independent civic-tech prototype — not affiliated with any government body.",
  applicationName: "CivicPulse",
  authors: [{ name: "CivicPulse Team" }],
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
