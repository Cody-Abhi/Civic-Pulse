import { z } from "zod";

/**
 * Single source of truth for CivicPulse enums and primitive value shapes.
 * Domain/UI/server types are derived from these via `z.infer` (§25.1).
 * This module is pure (no framework imports) — enforced by ESLint.
 */

export const ROLES = ["citizen", "authority", "admin"] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

export const CATEGORIES = [
  "GARBAGE",
  "POTHOLE",
  "STREETLIGHT",
  "WATER_LEAK",
  "DRAINAGE",
  "SANITATION",
  "INFRASTRUCTURE",
  "OTHER",
] as const;
export const categorySchema = z.enum(CATEGORIES);
export type ComplaintCategory = z.infer<typeof categorySchema>;

export const STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "REJECTED",
  "REOPENED",
] as const;
export const statusSchema = z.enum(STATUSES);
export type ComplaintStatus = z.infer<typeof statusSchema>;

export const OPEN_STATUSES: readonly ComplaintStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "REOPENED",
];

export const PRIORITY_BANDS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export const priorityBandSchema = z.enum(PRIORITY_BANDS);
export type PriorityBand = z.infer<typeof priorityBandSchema>;

export const HAZARD_FLAGS = [
  "INJURY_RISK",
  "EXPOSED_WIRE",
  "ROAD_BLOCKED",
  "SEWAGE_CONTAMINATION",
] as const;
export const hazardFlagSchema = z.enum(HAZARD_FLAGS);
export type HazardFlag = z.infer<typeof hazardFlagSchema>;

export const DURATION_BUCKETS = ["TODAY", "FEW_DAYS", "WEEK", "OVER_TWO_WEEKS"] as const;
export const durationBucketSchema = z.enum(DURATION_BUCKETS);
export type DurationBucket = z.infer<typeof durationBucketSchema>;

export const AFFECTED_SCALES = [0.1, 0.4, 0.7, 1.0] as const;
export const affectedScaleSchema = z.union([
  z.literal(0.1),
  z.literal(0.4),
  z.literal(0.7),
  z.literal(1.0),
]);
export type AffectedScale = z.infer<typeof affectedScaleSchema>;

export const REJECT_REASONS = [
  "DUPLICATE",
  "OUT_OF_JURISDICTION",
  "INSUFFICIENT_INFO",
  "SPAM",
  "WITHDRAWN_BY_REPORTER",
] as const;
export const rejectReasonSchema = z.enum(REJECT_REASONS);
export type RejectReason = z.infer<typeof rejectReasonSchema>;

export const severitySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export type Severity = z.infer<typeof severitySchema>;

export const FACTOR_KEYS = ["S", "H", "R", "D", "A", "G", "T"] as const;
export type FactorKey = (typeof FACTOR_KEYS)[number];

/** AI structured analysis output (PRD-AI-001); used to validate Gemini responses. */
export const aiAnalysisOutputSchema = z.object({
  predictedCategory: categorySchema,
  shortSummary: z.string().min(1).max(280),
  extractedKeywords: z.array(z.string()).max(20),
  detectedIssue: z.string().min(1).max(280),
  suggestedSeverity: severitySchema,
  confidence: z.number().min(0).max(1),
  recommendedDepartment: z.string().min(1),
  reasoning: z.string().min(1).max(600),
  possibleDuplicateIndicators: z.array(z.string()).max(20),
});
export type AIAnalysisOutput = z.infer<typeof aiAnalysisOutputSchema>;
