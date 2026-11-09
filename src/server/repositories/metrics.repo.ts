import "server-only";
import { getAdminFirestore } from "@/server/clients/firebase-admin";
import { withFirestoreTimeout } from "@/server/lib/timeout";
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

export const DEFAULT_CITY_METRICS: CityMetricsTotals = {
  totalComplaints: 0,
  resolvedComplaints: 0,
  inProgressComplaints: 0,
  submittedComplaints: 0,
  criticalComplaints: 0,
  resolutionRate: 0,
  avgResolutionHours: 0,
  activeCitizens: 0,
  open: 0,
  openByBand: {},
  openByDepartment: {},
  openByCategory: {},
  openByWard: {},
  isSynthetic: false,
  updatedAt: new Date(0).toISOString(),
};

export function getDefaultWardStats(): WardSummary[] {
  return PILOT_WARD_BOUNDARIES.map((ward) => ({
    wardId: ward.wardId,
    wardName: ward.wardName,
    totalComplaints: 0,
    openComplaints: 0,
    resolvedComplaints: 0,
    overdueComplaints: 0,
  }));
}

export async function getCityMetrics(): Promise<CityMetricsTotals> {
  try {
    const firestore = getAdminFirestore();
    const snap = await withFirestoreTimeout(
      firestore.collection("cityMetrics").doc("totals").get(),
      6000,
      "getCityMetrics",
    );
    if (snap.exists) {
      const data = snap.data() as Partial<CityMetricsTotals> | undefined;
      return {
        ...DEFAULT_CITY_METRICS,
        ...data,
        openByBand: data?.openByBand ?? DEFAULT_CITY_METRICS.openByBand,
        openByDepartment: data?.openByDepartment ?? DEFAULT_CITY_METRICS.openByDepartment,
        openByCategory: data?.openByCategory ?? DEFAULT_CITY_METRICS.openByCategory,
        openByWard: data?.openByWard ?? DEFAULT_CITY_METRICS.openByWard,
      };
    }
  } catch (error) {
    console.warn(
      "[metrics.repo] Failed to fetch cityMetrics/totals from Firestore (offline or uninitialized):",
      error instanceof Error ? error.message : error
    );
    return DEFAULT_CITY_METRICS;
  }

  // If totals document not yet created, return initial defaults
  return DEFAULT_CITY_METRICS;
}

export async function getWardStats(): Promise<WardSummary[]> {
  try {
    const totals = await getCityMetrics();
    const openByWard = totals?.openByWard || {};

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
  } catch (error) {
    console.warn(
      "[metrics.repo] Failed to get ward stats, returning default pilot ward stats:",
      error instanceof Error ? error.message : error
    );
    return getDefaultWardStats();
  }
}

export async function getDepartmentMetrics(departmentId: string) {
  try {
    const firestore = getAdminFirestore();
    const snap = await withFirestoreTimeout(
      firestore.collection("departmentMetrics").doc(departmentId).get(),
      6000,
      `getDepartmentMetrics(${departmentId})`,
    );
    if (snap.exists) {
      return snap.data();
    }
  } catch (error) {
    console.warn(
      `[metrics.repo] Failed to fetch department metrics for ${departmentId}:`,
      error instanceof Error ? error.message : error
    );
  }
  return null;
}

