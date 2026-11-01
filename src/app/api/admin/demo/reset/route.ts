import { NextResponse } from "next/server";
import { withApi } from "@/server/http/with-api";
import { resetDemoData } from "@/server/services/admin";

export const runtime = "nodejs";

export const POST = withApi(
  {
    roles: ["admin"],
  },
  async (_req, { user }) => {
    const result = await resetDemoData(user!);
    return NextResponse.json(result);
  },
);
