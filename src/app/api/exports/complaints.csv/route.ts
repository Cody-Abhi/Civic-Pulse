import { withApi, ApiError } from "@/server/http/with-api";
import { getAdminFirestore } from "@/server/clients/firebase-admin";
import { recordAuditLog } from "@/server/repositories/audit.repo";
import type { Complaint } from "@/domain/types";

export const runtime = "nodejs";

function sanitizeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  let s = String(val);

  // CSV Injection prevention (PRD §25.3, §36.3)
  // If first character is an active formula trigger, prepend a single quote
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }

  // RFC 4180 escaping: wrap in quotes if contains comma, quote, or newline
  if (/[",\n\r]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }

  return s;
}

export const GET = withApi(
  {
    roles: ["authority", "admin"],
  },
  async (req, { user }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
    }

    const url = new URL(req.url);
    const departmentParam = url.searchParams.get("departmentId");
    const categoryParam = url.searchParams.get("category");
    const statusParam = url.searchParams.get("status");

    const targetDept = user.role === "authority" ? user.departmentId : departmentParam || undefined;

    const firestore = getAdminFirestore();
    let query: FirebaseFirestore.Query = firestore.collection("complaints");

    if (targetDept) {
      query = query.where("departmentId", "==", targetDept);
    }
    if (categoryParam) {
      query = query.where("category", "==", categoryParam);
    }
    if (statusParam) {
      query = query.where("status", "==", statusParam);
    }

    query = query.orderBy("createdAt", "desc").limit(5000);
    const snapshot = await query.get();

    const complaints = snapshot.docs.map((doc) => doc.data() as Complaint);

    const headers = [
      "Reference",
      "Title",
      "Category",
      "Department",
      "Status",
      "Priority Score",
      "Priority Band",
      "Ward ID",
      "Ward Name",
      "Landmark",
      "Supporters",
      "Filed At",
      "Status Changed At",
      "SLA Due At",
    ];

    const rows = complaints.map((c) => [
      sanitizeCsvValue(c.ref),
      sanitizeCsvValue(c.title),
      sanitizeCsvValue(c.category),
      sanitizeCsvValue(c.departmentName || c.departmentId),
      sanitizeCsvValue(c.status),
      sanitizeCsvValue(c.priority.score),
      sanitizeCsvValue(c.priority.band),
      sanitizeCsvValue(c.location.wardId),
      sanitizeCsvValue(c.location.wardName),
      sanitizeCsvValue(c.location.landmark),
      sanitizeCsvValue(c.supporterCount),
      sanitizeCsvValue(c.createdAt),
      sanitizeCsvValue(c.statusChangedAt),
      sanitizeCsvValue(c.slaDueAt),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    // Audit logging (§25.3)
    await recordAuditLog({
      action: "DATA_EXPORT_COMPLAINTS",
      actorUid: user.uid,
      actorEmail: user.email,
      actorRole: user.role,
      targetId: targetDept || "all",
      targetType: "department",
      summary: `Exported ${complaints.length} complaints to CSV for department ${targetDept || "all"}`,
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="civicpulse-complaints-${dateStr}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  },
);
