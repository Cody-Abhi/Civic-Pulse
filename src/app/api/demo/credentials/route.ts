import { NextResponse } from "next/server";
import { withApi } from "@/server/http/with-api";
import { getServerEnv } from "@/lib/server-env";

export const runtime = "nodejs";

export const GET = withApi(
  {
    public: true,
  },
  async () => {
    const env = getServerEnv();

    if (!env.DEMO_MODE) {
      return NextResponse.json({ error: "Demo mode disabled" }, { status: 404 });
    }

    return NextResponse.json({
      accounts: [
        {
          role: "citizen",
          email: env.DEMO_CITIZEN_EMAIL,
          password: env.DEMO_PASSWORD,
          label: "Citizen Demo",
          description: "Report issues, upvote neighbors, view Priority Receipt",
        },
        {
          role: "authority",
          email: env.DEMO_AUTHORITY_EMAIL,
          password: env.DEMO_PASSWORD,
          label: "Roads Authority Demo",
          description: "Manage priority queue, operations map, department SLAs (Roads)",
        },
        {
          role: "authority",
          email: "drainage@demo.civicpulse.invalid",
          password: env.DEMO_PASSWORD,
          label: "Drainage Authority Demo",
          description: "Triage stormwater drains, flood hazards & culvert repairs",
        },
      ],
    });
  },
);
