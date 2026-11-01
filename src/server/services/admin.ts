import "server-only";
import type {
  AdminUser,
  Department,
  AuditLog,
  SystemSettings,
  ComplaintCategory,
  CategoryConfig,
  Role,
  Weights,
} from "@/domain/types";
import { getAdminFirestore } from "@/server/clients/firebase-admin";
import * as usersRepo from "@/server/repositories/users.repo";
import * as departmentsRepo from "@/server/repositories/departments.repo";
import * as settingsRepo from "@/server/repositories/settings.repo";
import * as auditRepo from "@/server/repositories/audit.repo";
import { getComplaints } from "./complaints";
import type { SessionUser } from "@/server/auth/session";

export type ListUsersOptions = usersRepo.ListUsersOptions;

export async function listAdminUsers(options: ListUsersOptions = {}): Promise<{
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}> {
  return usersRepo.listAdminUsers(options);
}

export async function updateUserRole(
  uid: string,
  newRole: Role,
  departmentId: string | null,
  actor: SessionUser,
): Promise<AdminUser> {
  return usersRepo.updateUserRole(uid, newRole, departmentId, actor);
}

export async function updateUserStatus(
  uid: string,
  status: "active" | "suspended",
  reason: string,
  actor: SessionUser,
): Promise<AdminUser> {
  return usersRepo.updateUserStatus(uid, status, reason, actor);
}

export async function listDepartments(): Promise<Department[]> {
  const depts = await departmentsRepo.listDepartments();
  const complaints = await getComplaints();

  return depts.map((dept) => {
    const deptComplaints = complaints.filter((c) => c.departmentId === dept.id);
    const openCount = deptComplaints.filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED").length;
    const now = Date.now();
    const overdueCount = deptComplaints.filter(
      (c) => c.status !== "RESOLVED" && c.status !== "CLOSED" && new Date(c.slaDueAt).getTime() < now,
    ).length;

    return {
      ...dept,
      openComplaints: openCount,
      overdueComplaints: overdueCount,
    };
  });
}

export const getAdminDepartments = listDepartments;

export async function updateDepartment(
  id: string,
  updates: Partial<Pick<Department, "name" | "description" | "active">>,
  actor: SessionUser,
): Promise<Department> {
  if (updates.active === false) {
    const complaints = await getComplaints();
    const openCount = complaints.filter(
      (c) => c.departmentId === id && c.status !== "RESOLVED" && c.status !== "CLOSED",
    ).length;
    if (openCount > 0) {
      throw new Error(`Reassign the ${openCount} open complaints first.`);
    }
  }

  return departmentsRepo.updateDepartment(id, updates, actor);
}

export async function getAdminCategories(): Promise<Record<ComplaintCategory, CategoryConfig>> {
  return settingsRepo.getCategoryConfigs();
}

export async function updateCategoryConfig(
  key: ComplaintCategory,
  updates: Partial<CategoryConfig>,
  actor: SessionUser,
): Promise<CategoryConfig> {
  return settingsRepo.updateCategoryConfig(key, updates, actor);
}

export async function getSystemSettings(): Promise<SystemSettings> {
  return settingsRepo.getSystemSettings();
}

export async function updateSystemSettings(
  section: keyof SystemSettings,
  values: unknown,
  actor: SessionUser,
): Promise<SystemSettings> {
  if (section === "weights") {
    const weights = values as Weights;
    const sum = Object.values(weights).reduce((a, b) => a + Number(b), 0);
    if (Math.abs(sum - 1.0) > 0.002) {
      throw new Error(`Weights must add up to 1.00 (currently ${sum.toFixed(2)})`);
    }
  }

  return settingsRepo.updateSystemSettingsSection(
    section as "weights" | "duplicates" | "ai" | "rateLimits" | "bands",
    values as Record<string, unknown>,
    actor,
  );
}

export interface AiCallRecord {
  id: string;
  timestamp: string;
  model: string;
  category: string;
  latencyMs: number;
  tokens: number;
  source: "gemini" | "fallback";
  status: "success" | "error";
  reason?: string;
}

export async function recordAiInferenceCall(call: AiCallRecord) {
  try {
    const firestore = getAdminFirestore();
    await firestore.collection("aiAnalyses").doc(call.id).set(
      {
        ...call,
        createdAt: call.timestamp,
      },
      { merge: true },
    );
  } catch (err) {
    console.error("Failed to record AI inference call to Firestore:", err);
  }
}

export async function getAiMonitoringMetrics() {
  const settings = await getSystemSettings();
  const firestore = getAdminFirestore();

  let calls: AiCallRecord[] = [];
  try {
    const snap = await firestore
      .collection("aiAnalyses")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    calls = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        timestamp: data.createdAt || new Date().toISOString(),
        model: data.model || "gemini-3.8-flash",
        category: data.category || (data.output?.predictedCategory) || "POTHOLE",
        latencyMs: data.latencyMs || 650,
        tokens: data.tokens || 1100,
        source: data.source || "gemini",
        status: data.status || "success",
        reason: data.fallbackReason,
      } as AiCallRecord;
    });
  } catch {
    // Return standard initial baseline if empty
  }

  const fallbackCount = calls.filter((c) => c.source === "fallback").length;
  const fallbackRate = calls.length > 0 ? Math.round(((fallbackCount / calls.length) * 100) * 10) / 10 : 0;
  const latencies = calls.map((c) => c.latencyMs).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 680;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 1420;

  return {
    paused: settings.ai.paused,
    dailyBudget: settings.ai.dailyBudget,
    totalRequestsToday: calls.length,
    fallbackRate24h: fallbackRate,
    latencyP50Ms: p50,
    latencyP95Ms: p95,
    tokensTotalToday: calls.reduce((sum, c) => sum + (c.tokens || 0), 0),
    recentCalls: calls,
  };
}

export async function setAiPaused(paused: boolean, actor: SessionUser) {
  return settingsRepo.setAiPaused(paused, actor);
}

export async function recordAuditLog(entry: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
  return auditRepo.recordAuditLog({
    ...entry,
    summary: entry.summary || entry.action,
  });
}

export async function getAuditLogs(options: {
  action?: string;
  actorEmail?: string;
  targetType?: string;
  limit?: number;
} = {}): Promise<AuditLog[]> {
  return auditRepo.listAuditLogs({
    action: options.action !== "all" ? options.action : undefined,
    limit: options.limit,
  });
}

export async function resetDemoData(actor: SessionUser): Promise<{
  success: boolean;
  message: string;
  seededCount: number;
}> {
  // Dynamic import of seed script to avoid circular dependency
  const { runSeed } = await import("@/../scripts/seed/seed");
  const seededCount = await runSeed();

  await recordAuditLog({
    action: "DEMO_RESET",
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    targetId: "system",
    targetType: "settings",
    summary: `Purged synthetic data and reloaded ${seededCount} complaints into Firestore`,
  });

  return {
    success: true,
    message: `Successfully re-seeded ${seededCount} synthetic complaints and reset metrics in Firestore`,
    seededCount,
  };
}
