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
          description: "Report issues, AI suggestions, duplicate radar & Priority Receipt",
          tour: "citizen",
        },
        {
          role: "authority",
          email: env.DEMO_AUTHORITY_EMAIL,
          password: env.DEMO_PASSWORD,
          label: "Roads Authority Demo",
          description: "Triage queue, SLA management, duplicate confirmation & resolution",
          tour: "authority",
        },
        {
          role: "admin",
          email: "admin.demo@civicpulse.invalid",
          password: env.DEMO_PASSWORD,
          label: "Admin (View-Only) Demo",
          description: "Explore AI monitoring, audit logs & city metrics (mutations disabled)",
          viewOnly: true,
          tour: "admin",
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
