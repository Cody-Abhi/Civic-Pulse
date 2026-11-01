import type {
  AffectedScale,
  Bands,
  FactorKey,
  HazardFlag,
  PriorityBand,
  PriorityLineItem,
  PriorityResult,
  Severity,
  Weights,
} from "./types";
import { FACTOR_KEYS } from "./schemas";

/**
 * Smart Civic Priority Engine (§29) — deterministic, explainable, auditable.
 * Gemini has zero influence here. Pure: no `Date.now()` inside; the caller
 * passes `nowMs`.
 */
export interface PriorityInputs {
  baseSeverity: Severity;
  verifiedSeverity: Severity | null;
  hazardFlags: HazardFlag[];
  independentReporterCount: number;
  createdAtMs: number;
  reopenedAtMs?: number;
  nowMs: number;
  slaHours: number;
  affectedScale: AffectedScale;
  nearbyOpenClusters: number;
  timeSensitive: boolean;
  seasonMonths: number[];
  adjustment: number;
  weights: Weights;
  bands: Bands;
  weightsVersion: number;
  provisional?: boolean;
}

const HOUR_MS = 3_600_000;
const IST_OFFSET_MS = 5.5 * HOUR_MS;
const LN_11 = Math.log(11);
const EPS = 1e-9;

const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));

/** Round half up, float-safe (§29.2). */
const roundHalfUp = (v: number): number => Math.floor(v + 0.5 + EPS);

/** Month 1–12 in IST for a UTC epoch (pure — derived from the passed nowMs). */
export function istMonth(nowMs: number): number {
  return new Date(nowMs + IST_OFFSET_MS).getUTCMonth() + 1;
}

export function bandForScore(score: number, bands: Bands): PriorityBand {
  if (score >= bands.critical) return "CRITICAL";
  if (score >= bands.high) return "HIGH";
  if (score >= bands.medium) return "MEDIUM";
  return "LOW";
}

export function assertWeightsSumToOne(weights: Weights): void {
  const sum = FACTOR_KEYS.reduce((acc, k) => acc + weights[k], 0);
  if (Math.abs(sum - 1) > 1e-6) {
    throw new Error(`Priority weights must sum to 1 (got ${sum}).`);
  }
}

const LABELS: Record<FactorKey, string> = {
  S: "Severity",
  H: "Safety hazard",
  R: "Reports",
  D: "Waiting time",
  A: "Affected",
  G: "Hotspot",
  T: "Season",
};

function computeFactors(i: PriorityInputs): Record<FactorKey, number> {
  const sev = i.verifiedSeverity ?? i.baseSeverity;
  const u = Math.max(0, i.independentReporterCount - 1);
  const ageMs = i.nowMs - (i.reopenedAtMs ?? i.createdAtMs);
  const ageHours = Math.max(0, ageMs / HOUR_MS);
  const inSeason =
    i.timeSensitive &&
    (i.seasonMonths.length === 0 || i.seasonMonths.includes(istMonth(i.nowMs)));

  return {
    S: clamp((sev - 1) / 4, 0, 1),
    H: i.hazardFlags.length > 0 ? 1 : 0,
    R: clamp(Math.log(1 + u) / LN_11, 0, 1),
    D: clamp(ageHours / (2 * i.slaHours), 0, 1),
    A: i.affectedScale,
    G: clamp(i.nearbyOpenClusters / 10, 0, 1),
    T: inSeason ? 1 : 0,
  };
}

function detailFor(key: FactorKey, i: PriorityInputs, factor: number): string {
  const sev = i.verifiedSeverity ?? i.baseSeverity;
  const ageHours = Math.round(
    Math.max(0, (i.nowMs - (i.reopenedAtMs ?? i.createdAtMs)) / HOUR_MS),
  );
  switch (key) {
    case "S":
      return `Base severity ${sev} of 5`;
    case "H":
      return factor > 0
        ? `Risk reported: ${i.hazardFlags.join(", ").toLowerCase()}`
        : "No hazard reported";
    case "R":
      return `${i.independentReporterCount} independent reporter${i.independentReporterCount === 1 ? "" : "s"}`;
    case "D":
      return `${ageHours} h of ${i.slaHours} h target`;
    case "A":
      return `Affected scale ${i.affectedScale}`;
    case "G":
      return `${i.nearbyOpenClusters} other open issue${i.nearbyOpenClusters === 1 ? "" : "s"} within 500 m`;
    case "T":
      return factor > 0 ? "In season for this category" : "Not season-sensitive now";
  }
}

export function computePriority(i: PriorityInputs): PriorityResult {
  assertWeightsSumToOne(i.weights);

  const factors = computeFactors(i);

  const lineItems: PriorityLineItem[] = FACTOR_KEYS.map((key) => {
    const factor = factors[key];
    const weight = i.weights[key];
    return {
      key,
      label: LABELS[key],
      detail: detailFor(key, i, factor),
      factor,
      weight,
      points: 100 * weight * factor,
    };
  });

  const rawSum = lineItems.reduce((acc, li) => acc + li.points, 0);
  const base = roundHalfUp(rawSum);
  const adjustment = Math.trunc(i.adjustment);
  const score = clamp(base + adjustment, 0, 100);

  if (adjustment !== 0) {
    lineItems.push({
      key: "ADJ",
      label: "Manual adjustment",
      detail: `${adjustment > 0 ? "+" : ""}${adjustment} by authority`,
      factor: 0,
      weight: 0,
      points: adjustment,
    });
  }

  return {
    score,
    band: bandForScore(score, i.bands),
    base,
    adjustment,
    factors,
    lineItems,
    weightsVersion: i.weightsVersion,
    computedAt: new Date(i.nowMs).toISOString(),
    provisional: i.provisional ?? false,
  };
}

/** One-line human explanation (§29.5). */
export function priorityExplanation(result: PriorityResult): string {
  const band = result.band.toLowerCase();
  const top = result.lineItems
    .filter((li) => li.key !== "ADJ" && li.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 2)
    .map((li) => li.label.toLowerCase());
  if (top.length === 0) return `${result.band}: minimal signals.`;
  return `${result.band.charAt(0) + band.slice(1)} mainly because of ${top.join(" and ")}.`;
}
