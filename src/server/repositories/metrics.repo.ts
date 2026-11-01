import "server-only";
import { getAdminFirestore } from "@/server/clients/firebase-admin";
import type { WardSummary } from "@/domain/types";

export interface CityMetricsTotals {
  totalComplaints: number;
  resolvedComplaints: number;
  inProgressComplaints: number;
  submittedComplaints: number;
  criticalComplaints: number;
  resolutionRate: number;
  avgResolutionHours: number;
  activeCitizens: number;
  open: number;
  openByBand: Record<string, number>;
  openByDepartment: Record<string, number>;
  openByCategory: Record<string, number>;
  openByWard: Record<string, number>;
  isSynthetic: boolean;
  updatedAt: string;
}

export async function getCityMetrics(): Promise<CityMetricsTotals> {
  const firestore = getAdminFirestore();
  const snap = await firestore.collection("cityMetrics").doc("totals").get();
  if (snap.exists) {
    return snap.data() as CityMetricsTotals;
  }

  // If totals document not yet created, return initial defaults
  return {
    totalComplaints: 0,
    resolvedComplaints: 0,
    inProgressComplaints: 0,
    submittedComplaints: 0,
    criticalComplaints: 0,
    resolutionRate: 0,
    avgResolutionHours: 24,
    activeCitizens: 0,
    open: 0,
    openByBand: {},
    openByDepartment: {},
    openByCategory: {},
    openByWard: {},
    isSynthetic: false,
    updatedAt: new Date().toISOString(),
  };
}

export async function getWardStats(): Promise<WardSummary[]> {
  const firestore = getAdminFirestore();

  // Read complaints to compile live ward statistics
  const snap = await firestore.collection("complaints").get();
  const map = new Map<string, WardSummary>();
  const now = Date.now();

  snap.docs.forEach((doc) => {
    const c = doc.data();
    const wardId = c.location?.wardId || "ward-blr-central";
    const wardName = c.location?.wardName || "Central Bengaluru";

    if (!map.has(wardId)) {
      map.set(wardId, {
        wardId,
        wardName,
        totalComplaints: 0,
        openComplaints: 0,
        resolvedComplaints: 0,
        overdueComplaints: 0,
      });
    }

    const stat = map.get(wardId)!;
    stat.totalComplaints++;
    if (c.status === "RESOLVED" || c.status === "CLOSED") {
      stat.resolvedComplaints++;
    } else {
      stat.openComplaints++;
      if (c.slaDueAt && new Date(c.slaDueAt).getTime() < now) {
        stat.overdueComplaints++;
      }
    }
  });

  return Array.from(map.values()).sort((a, b) => b.totalComplaints - a.totalComplaints);
}

export async function getDepartmentMetrics(departmentId: string) {
  const firestore = getAdminFirestore();
  const snap = await firestore.collection("departmentMetrics").doc(departmentId).get();
  if (snap.exists) {
    return snap.data();
  }
  return null;
}

