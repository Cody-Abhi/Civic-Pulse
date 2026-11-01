import { NextResponse } from "next/server";
import { withApi } from "@/server/http/with-api";
import { getCityMetrics } from "@/server/services/complaints";

export const runtime = "nodejs";

export const GET = withApi(
  {
    public: true,
  },
  async () => {
    const metrics = getCityMetrics();
    return NextResponse.json(metrics, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  },
);
