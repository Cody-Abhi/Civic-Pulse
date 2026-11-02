import { ImageResponse } from "next/og";
import { BRAND_PRIMARY_HEX } from "@/lib/brand";

export const runtime = "nodejs";
export const alt = "CivicPulse AI — Transparent Civic Action Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: BRAND_PRIMARY_HEX,
          padding: "80px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: BRAND_PRIMARY_HEX,
              }}
            />
          </div>
          <span
            style={{
              fontSize: "36px",
              fontWeight: 800,
              letterSpacing: "-1px",
            }}
          >
            CivicPulse
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "64px",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-2px",
              maxWidth: "900px",
            }}
          >
            Turning citizen voices into intelligent city action.
          </div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 400,
              opacity: 0.9,
              maxWidth: "800px",
            }}
          >
            Independent civic-tech prototype with transparent 7-factor priority receipts and real-time municipal routing.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid rgba(255, 255, 255, 0.2)",
            paddingTop: "28px",
            fontSize: "18px",
            opacity: 0.85,
          }}
        >
          <span>Bengaluru Pilot · OpenFreeMap & MapLibre GL</span>
          <span>Not affiliated with BBMP or any government body</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}

