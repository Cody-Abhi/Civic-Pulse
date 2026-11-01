import "server-only";
import { getAdminFirestore } from "@/server/clients/firebase-admin";
import type { Department } from "@/domain/types";
import { recordAuditLog } from "./audit.repo";
import type { SessionUser } from "@/server/auth/session";

export async function listDepartments(): Promise<Department[]> {
  const firestore = getAdminFirestore();
  const snapshot = await firestore.collection("departments").get();
  return snapshot.docs.map((doc) => doc.data() as Department);
}

export async function getDepartment(id: string): Promise<Department | null> {
  const firestore = getAdminFirestore();
  const doc = await firestore.collection("departments").doc(id).get();
  if (!doc.exists) return null;
  return doc.data() as Department;
}

export async function updateDepartment(
  id: string,
  updates: Partial<Pick<Department, "name" | "description" | "active" | "categories">>,
  actor: SessionUser,
): Promise<Department> {
  const firestore = getAdminFirestore();
  const docRef = firestore.collection("departments").doc(id);
  const snap = await docRef.get();
  if (!snap.exists) {
    throw new Error(`Department ${id} not found`);
  }

  const before = snap.data() as Department;
  const merged: Department = {
    ...before,
    ...updates,
  };

  await docRef.set(merged, { merge: true });

  await recordAuditLog({
    action: "DEPARTMENT_UPDATED",
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    targetId: id,
    targetType: "department",
    summary: `Updated department ${before.name}`,
    before: { name: before.name, active: before.active, description: before.description },
    after: { name: merged.name, active: merged.active, description: merged.description },
  });

  return merged;
}

