import { NextResponse, type NextRequest } from "next/server";
import { checkNearbyDuplicates } from "@/server/services/ai";
import { z } from "zod";
import { CATEGORIES } from "@/domain/schemas";

export const runtime = "nodejs";

const duplicateCheckSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  category: z.enum(CATEGORIES).optional(),
  text: z.string().min(1).max(2000),
  excludeId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = duplicateCheckSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { candidates, method } = await checkNearbyDuplicates({
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      category: parsed.data.category,
      text: parsed.data.text,
      excludeId: parsed.data.excludeId,
    });

    return NextResponse.json(
      {
        candidates,
        method,
      },
      { status: 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to check duplicates";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

