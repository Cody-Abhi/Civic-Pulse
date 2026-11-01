import { NextResponse } from "next/server";
import { z } from "zod";
import { withApi } from "@/server/http/with-api";
import { checkNearbyDuplicates } from "@/server/services/ai";
import { CATEGORIES } from "@/domain/schemas";

export const runtime = "nodejs";

const duplicateCheckSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  category: z.enum(CATEGORIES).optional(),
  text: z.string().min(1).max(2000),
  excludeId: z.string().optional(),
});

type DuplicateCheckBody = z.infer<typeof duplicateCheckSchema>;

export const POST = withApi<DuplicateCheckBody>(
  {
    schema: duplicateCheckSchema,
  },
  async (_req, { body }) => {
    const { candidates, method } = await checkNearbyDuplicates({
      lat: body.lat,
      lng: body.lng,
      category: body.category,
      text: body.text,
      excludeId: body.excludeId,
    });

    return NextResponse.json(
      {
        candidates,
        method,
      },
      { status: 200 },
    );
  },
);
