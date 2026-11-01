import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { analyzeComplaintDraft } from "@/server/services/ai";
import { z } from "zod";
import { CATEGORIES } from "@/domain/schemas";

export const runtime = "nodejs";

const analyzeDraftSchema = z.object({
  title: z.string().max(140).optional(),
  description: z.string().min(5, "Description must be at least 5 characters").max(1200),
  categoryHint: z.enum(CATEGORIES).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const json = await req.json().catch(() => ({}));
    const parsed = analyzeDraftSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { analysis, analysisToken } = await analyzeComplaintDraft(
      {
        title: parsed.data.title,
        description: parsed.data.description,
        categoryHint: parsed.data.categoryHint,
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to analyze draft";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

