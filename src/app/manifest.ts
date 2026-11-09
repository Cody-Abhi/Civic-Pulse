import type { MetadataRoute } from "next";
import { BRAND_PRIMARY_HEX, BRAND_BG_HEX } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CivicPulse AI — Transparent Civic Action",
    short_name: "CivicPulse",
    description:
      "Turning citizen voices into intelligent municipal action with transparent 7-factor priority receipts and intelligent dispatch routing.",
    start_url: "/",
    display: "standalone",
    background_color: BRAND_BG_HEX,
    theme_color: BRAND_PRIMARY_HEX,
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}

