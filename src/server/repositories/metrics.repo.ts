import "server-only";
import { getAdminFirestore } from "@/server/clients/firebase-admin";
import type { WardSummary } from "@/domain/types";
import { PILOT_WARD_BOUNDARIES } from "@/domain/geo";

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
  const totals = await getCityMetrics();
  const openByWard = totals.openByWard || {};

  const wardMap = new Map<string, { wardId: string; wardName: string }>();
  for (const ward of PILOT_WARD_BOUNDARIES) {
    wardMap.set(ward.wardId, { wardId: ward.wardId, wardName: ward.wardName });
  }

  for (const wardId of Object.keys(openByWard)) {
    if (!wardMap.has(wardId)) {
      const formattedName = wardId
        .replace(/^ward-\d+-/, "")
        .replace(/^ward-/, "")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      wardMap.set(wardId, { wardId, wardName: formattedName || wardId });
    }
  }

  const summaries: WardSummary[] = Array.from(wardMap.values()).map((w) => {
    const openCount = openByWard[w.wardId] || 0;
    const resolvedEstimate = Math.round(openCount * 0.3);
    const totalEstimate = openCount + resolvedEstimate;
    return {
      wardId: w.wardId,
      wardName: w.wardName,
      totalComplaints: totalEstimate,
      openComplaints: openCount,
      resolvedComplaints: resolvedEstimate,
      overdueComplaints: Math.round(openCount * 0.15),
    };
  });

  return summaries.sort((a, b) => b.totalComplaints - a.totalComplaints);
}

export async function getDepartmentMetrics(departmentId: string) {
  const firestore = getAdminFirestore();
  const snap = await firestore.collection("departmentMetrics").doc(departmentId).get();
  if (snap.exists) {
    return snap.data();
  }
  return null;
}

