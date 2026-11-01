import { NextResponse, type NextRequest } from "next/server";
import { generateGroundedInsights } from "@/server/services/ai";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") || "city:blr";

    const insights = await generateGroundedInsights(scope);

    return NextResponse.json({ insights }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate grounded insights";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

