import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/session";
import { updateCategoryConfig } from "@/server/services/admin";
import type { ComplaintCategory } from "@/domain/types";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ key: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { key } = await context.params;

  try {
    const body = await request.json();
    const updated = updateCategoryConfig(key as ComplaintCategory, body, user);
    return NextResponse.json({ success: true, category: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

