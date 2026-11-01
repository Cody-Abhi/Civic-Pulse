import { NextResponse } from "next/server";
import { z } from "zod";
import { withApi } from "@/server/http/with-api";
import { setAiPaused } from "@/server/services/admin";

export const runtime = "nodejs";

const pauseSchema = z.object({
  paused: z.boolean(),
});

type PauseBody = z.infer<typeof pauseSchema>;

export const POST = withApi<PauseBody>(
  {
    roles: ["admin"],
    schema: pauseSchema,
  },
  async (_req, { user, body }) => {
    const res = setAiPaused(body.paused, user!);
    return NextResponse.json({ success: true, ...res });
  },
);
