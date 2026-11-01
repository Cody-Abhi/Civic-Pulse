import { NextResponse } from "next/server";
import { withApi } from "@/server/http/with-api";
import { updateCategoryConfig } from "@/server/services/admin";
import type { ComplaintCategory } from "@/domain/types";

export const runtime = "nodejs";

export const PATCH = withApi<Record<string, unknown>, { key: string }>(
  {
    roles: ["admin"],
  },
  async (_req, { user, body, params }) => {
    const { key } = params;
    const updated = updateCategoryConfig(key as ComplaintCategory, body, user!);
    return NextResponse.json({ success: true, category: updated });
  },
);
