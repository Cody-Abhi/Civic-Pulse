import { NextResponse } from "next/server";
import { z } from "zod";
import { withApi } from "@/server/http/with-api";
import { analyzeComplaintDraft } from "@/server/services/ai";
import { CATEGORIES } from "@/domain/schemas";

export const runtime = "nodejs";

const analyzeDraftSchema = z.object({
  title: z.string().max(140).optional(),
  description: z.string().min(5, "Description must be at least 5 characters").max(1200),
  categoryHint: z.enum(CATEGORIES).optional(),
  images: z
    .array(
      z.object({
        data: z.string(),
        mimeType: z.string().default("image/jpeg"),
      }),
    )
    .max(3)
    .optional(),
});

type AnalyzeDraftBody = z.infer<typeof analyzeDraftSchema>;

export const POST = withApi<AnalyzeDraftBody>(
  {
    schema: analyzeDraftSchema,
  },
  async (_req, { user, body }) => {
    const { analysis, analysisToken } = await analyzeComplaintDraft(
      {
        title: body.title,
        description: body.description,
        categoryHint: body.categoryHint,
        images: body.images,
      },
      user,
    );

    return NextResponse.json(
      {
        analysis: {
          id: analysis.id,
          source: analysis.source,
          output: analysis.output,
          fallbackReason: analysis.fallbackReason,
          latencyMs: analysis.latencyMs,
          model: analysis.model,
        },
        analysisToken,
      },
      { status: 200 },
    );
  },
);
