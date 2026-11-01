import type { ComplaintCategory, ComplaintStatus, PriorityBand } from "./types";

/**
 * Analytics formulas (§31.2) — pure and unit-tested. Every number the UI shows
 * comes from these, so each has one definition and anti-double-counting rules.
 * Rates are returned as 0–100 percentages (or null when undefined), hours as
 * hours. The caller formats; tooltips show the formula.
 */

/** Approximate resolution-time histogram buckets (hours). */
export const RESOLUTION_BUCKETS_H = [0, 6, 24, 48, 72, 120, 240] as const;
const BUCKET_MIDPOINTS = [3, 15, 36, 60, 96, 180, 300] as const;

export interface DailyDoc {
  received: number;
  resolved: number;
  duplicatesConfirmed: number;
  supportsAdded: number;
  reopened: number;
  slaMet: number;
  slaMissed: number;
  resolutionHoursSum: number;
  resolutionCount: number;
  /** 7 buckets aligned to RESOLUTION_BUCKETS_H (last is >240h). */
  resolutionHist: number[];
  byCategory?: Partial<Record<ComplaintCategory, { received: number }>>;
  byWard?: Record<string, number>;
}

export interface Totals {
  open: number;
  openByBand: Partial<Record<PriorityBand, number>>;
  openByWard?: Record<string, number>;
  syntheticCount: number;
}

export interface UsageCounters {
  acceptedTrue: number;
  acceptedFalse: number;
}

const ratioPct = (num: number, den: number): number | null =>
  den > 0 ? (num / den) * 100 : null;

export const sumBy = (
  dailies: DailyDoc[],
  key: Exclude<keyof DailyDoc, "resolutionHist" | "byCategory" | "byWard">,
): number => dailies.reduce((acc, d) => acc + (d[key] as number), 0);

export function received(dailies: DailyDoc[]): number {
  return sumBy(dailies, "received");
}
export function resolved(dailies: DailyDoc[]): number {
  return sumBy(dailies, "resolved");
}

/** Unique issues = received − confirmed duplicate children (§31.2). */
export function uniqueIssues(dailies: DailyDoc[]): number {
  return received(dailies) - sumBy(dailies, "duplicatesConfirmed");
}

/** Resolution rate (%). Can exceed 100 when clearing backlog (shown with note). */
export function resolutionRate(dailies: DailyDoc[]): number | null {
  return ratioPct(resolved(dailies), received(dailies));
}

export function duplicateRate(dailies: DailyDoc[]): number | null {
  return ratioPct(sumBy(dailies, "duplicatesConfirmed"), received(dailies));
}

export function reopenRate(dailies: DailyDoc[]): number | null {
  return ratioPct(sumBy(dailies, "reopened"), resolved(dailies));
}

export function slaCompliance(dailies: DailyDoc[]): number | null {
  const met = sumBy(dailies, "slaMet");
  const missed = sumBy(dailies, "slaMissed");
  return ratioPct(met, met + missed);
}

export function averageResolutionHours(dailies: DailyDoc[]): number | null {
  const sum = sumBy(dailies, "resolutionHoursSum");
  const count = sumBy(dailies, "resolutionCount");
  return count > 0 ? sum / count : null;
}

export function classificationAcceptance(usage: UsageCounters): number | null {
  return ratioPct(usage.acceptedTrue, usage.acceptedTrue + usage.acceptedFalse);
}

/** Approximate median resolution time (hours) from summed histogram buckets. */
export function approxMedianResolutionHours(dailies: DailyDoc[]): number | null {
  const hist = new Array(BUCKET_MIDPOINTS.length).fill(0);
  for (const d of dailies) {
    d.resolutionHist.forEach((v, i) => {
      if (i < hist.length) hist[i] += v;
    });
  }
  const total = hist.reduce((a: number, b: number) => a + b, 0);
  if (total === 0) return null;
  const half = total / 2;
  let cumulative = 0;
  for (let i = 0; i < hist.length; i++) {
    cumulative += hist[i] as number;
    if (cumulative >= half) return BUCKET_MIDPOINTS[i] as number;
  }
  return BUCKET_MIDPOINTS[BUCKET_MIDPOINTS.length - 1] as number;
}

export interface CategoryCount {
  category: ComplaintCategory;
  received: number;
}

export function categoryDistribution(dailies: DailyDoc[]): CategoryCount[] {
  const totals = new Map<ComplaintCategory, number>();
  for (const d of dailies) {
    for (const [cat, v] of Object.entries(d.byCategory ?? {})) {
      totals.set(cat as ComplaintCategory, (totals.get(cat as ComplaintCategory) ?? 0) + (v?.received ?? 0));
    }
  }
  return [...totals.entries()]
    .map(([category, r]) => ({ category, received: r }))
    .sort((a, b) => b.received - a.received);
}

/** True when any synthetic record contributes → UI shows "Includes demo data". */
export function includesDemoData(totals: Totals): boolean {
  return totals.syntheticCount > 0;
}

export const OPEN_STATUS_SET: ReadonlySet<ComplaintStatus> = new Set([
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "REOPENED",
]);

export interface AnalyticsSummary {
  received: number;
  uniqueIssues: number;
  resolved: number;
  open: number;
  resolutionRate: number | null;
  duplicateRate: number | null;
  reopenRate: number | null;
  slaCompliance: number | null;
  averageResolutionHours: number | null;
  medianResolutionHours: number | null;
  supportsAdded: number;
  openByBand: Partial<Record<PriorityBand, number>>;
  includesDemoData: boolean;
}

/** Assemble the dashboard summary for a day range + current totals. */
export function summariseRange(dailies: DailyDoc[], totals: Totals): AnalyticsSummary {
  return {
    received: received(dailies),
    uniqueIssues: uniqueIssues(dailies),
    resolved: resolved(dailies),
    open: totals.open,
    resolutionRate: resolutionRate(dailies),
    duplicateRate: duplicateRate(dailies),
    reopenRate: reopenRate(dailies),
    slaCompliance: slaCompliance(dailies),
    averageResolutionHours: averageResolutionHours(dailies),
    medianResolutionHours: approxMedianResolutionHours(dailies),
    supportsAdded: sumBy(dailies, "supportsAdded"),
    openByBand: totals.openByBand,
    includesDemoData: includesDemoData(totals),
  };
}
