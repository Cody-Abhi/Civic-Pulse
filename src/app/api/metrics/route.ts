import { NextResponse } from "next/server";
import { getCityMetrics } from "@/server/services/complaints";

export const runtime = "nodejs";

export async function GET() {
  try {
    const metrics = getCityMetrics();
    return NextResponse.json(metrics, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load city metrics";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
