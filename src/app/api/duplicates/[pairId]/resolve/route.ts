import { NextResponse } from "next/server";
import { z } from "zod";
import { withApi } from "@/server/http/with-api";
import { resolveDuplicatePair } from "@/server/services/ai";

export const runtime = "nodejs";

const resolveSchema = z.object({
  decision: z.enum(["CONFIRM", "DISMISS"]),
  rootId: z.string().optional(),
  note: z.string().max(500).optional(),
});

type ResolveBody = z.infer<typeof resolveSchema>;

export const POST = withApi<ResolveBody, { pairId: string }>(
  {
    roles: ["authority", "admin"],
    schema: resolveSchema,
  },
  async (_req, { user, body, params }) => {
    const { pairId } = params;
    const result = await resolveDuplicatePair(
      pairId,
      body.decision,
      body.rootId,
      body.note,
      user!,
    );

    return NextResponse.json({ success: true, result }, { status: 200 });
  },
);
