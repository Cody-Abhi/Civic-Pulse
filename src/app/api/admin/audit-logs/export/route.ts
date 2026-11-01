import { NextResponse } from "next/server";
import { withApi } from "@/server/http/with-api";
import { getAuditLogs } from "@/server/services/admin";

export const runtime = "nodejs";

export const GET = withApi(
  {
    roles: ["admin"],
  },
  async () => {
    const logs = await getAuditLogs({ limit: 1000 });
    const headers = ["Timestamp", "Actor Email", "Actor Role", "Action", "Target Type", "Target ID", "Summary"];
    const rows = logs.map((l) => [
      l.createdAt,
      l.actorEmail,
      l.actorRole,
      l.action,
      l.targetType,
      l.targetId,
      `"${l.summary.replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="civicpulse-audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  },
);
