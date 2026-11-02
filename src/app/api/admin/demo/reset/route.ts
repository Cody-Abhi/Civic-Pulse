import { NextResponse } from "next/server";
import { z } from "zod";
import { withApi } from "@/server/http/with-api";
import { resetDemoData } from "@/server/services/admin";

export const runtime = "nodejs";

const resetDemoSchema = z.object({
  confirmation: z.literal("RESET DEMO", {
    errorMap: () => ({ message: 'Typed confirmation must equal "RESET DEMO"' }),
  }),
});

export const POST = withApi(
  {
    roles: ["admin"],
    schema: resetDemoSchema,
  },
  async (_req, { user }) => {
    const result = await resetDemoData(user!);
    return NextResponse.json(result);
  },
);
