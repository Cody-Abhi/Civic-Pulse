import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/server-env";

export const runtime = "nodejs";

export async function GET() {
  const env = getServerEnv();

  if (!env.DEMO_MODE) {
    return NextResponse.json({ error: "Demo mode disabled" }, { status: 404 });
  }

  return NextResponse.json({
    accounts: [
      {
        role: "citizen",
        email: env.DEMO_CITIZEN_EMAIL,
        label: "Citizen Demo",
        description: "Report issues, upvote neighbors, view Priority Receipt",
      },
      {
        role: "authority",
        email: env.DEMO_AUTHORITY_EMAIL,
        label: "Roads Authority Demo",
        description: "Manage priority queue, operations map, department SLAs",
      },
      {
        role: "admin",
        email: env.DEMO_ADMIN_EMAIL,
        label: "City Admin Demo",
        description: "System governance, AI metrics, audit logs, priority weights",
      },
    ],
  });
}
