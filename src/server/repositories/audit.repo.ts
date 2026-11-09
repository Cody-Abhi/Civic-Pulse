import "server-only";
import { getAdminFirestore } from "@/server/clients/firebase-admin";
import { withFirestoreTimeout } from "@/server/lib/timeout";
import type { AuditLog, Role } from "@/domain/types";

export interface CreateAuditLogInput {
  action: string;
  actorUid: string;
  actorEmail: string;
  actorRole: Role;
  targetId: string;
  targetType: "user" | "complaint" | "department" | "category" | "settings";
  summary: string;
  before?: Record<string, unknown> | null | undefined;
  after?: Record<string, unknown> | null | undefined;
  reason?: string | undefined;
  ipHash?: string | undefined;
  requestId?: string | undefined;
}

export async function recordAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
  const firestore = getAdminFirestore();
  const ref = firestore.collection("auditLogs").doc();
  const log: AuditLog = {
    id: ref.id,
    action: input.action,
    actorUid: input.actorUid,
    actorEmail: input.actorEmail,
    actorRole: input.actorRole,
    targetId: input.targetId,
    targetType: input.targetType,
    summary: input.summary,
    before: input.before || null,
    after: input.after || null,
    reason: input.reason || undefined,
    ipHash: input.ipHash || undefined,
    createdAt: new Date().toISOString(),
  };

  await ref.set(log);
  return log;
}

export async function listAuditLogs(options?: {
  action?: string | undefined;
  actorUid?: string | undefined;
  targetId?: string | undefined;
  limit?: number | undefined;
}): Promise<AuditLog[]> {
  const firestore = getAdminFirestore();
  let query: FirebaseFirestore.Query = firestore.collection("auditLogs");

  if (options?.action) {
    query = query.where("action", "==", options.action);
  }
  if (options?.actorUid) {
    query = query.where("actorUid", "==", options.actorUid);
  }
  if (options?.targetId) {
    query = query.where("targetId", "==", options.targetId);
  }

  query = query.orderBy("createdAt", "desc").limit(options?.limit || 50);

  const snapshot = await withFirestoreTimeout(
    query.get(),
    6000,
    "listAuditLogs",
  );
  return snapshot.docs.map((doc) => doc.data() as AuditLog);
}
