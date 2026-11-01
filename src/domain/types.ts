/**
 * Shared domain types (§25.1). Enum/primitive types come from `schemas.ts`
 * (single source via `z.infer`); the document/record shapes live here.
 */
import type {
  Role,
  ComplaintCategory,
  ComplaintStatus,
  PriorityBand,
  HazardFlag,
  DurationBucket,
  AffectedScale,
  RejectReason,
  Severity,
  FactorKey,
  AIAnalysisOutput,
} from "./schemas";

export type {
  Role,
  ComplaintCategory,
  ComplaintStatus,
  PriorityBand,
  HazardFlag,
  DurationBucket,
  AffectedScale,
  RejectReason,
  Severity,
  FactorKey,
  AIAnalysisOutput,
};

/** Priority factor weights; must sum to 1 (§29.2). */
export type Weights = Record<FactorKey, number>;
/** Band thresholds (inclusive lower bounds), e.g. { critical:70, high:50, medium:30 }. */
export interface Bands {
  critical: number;
  high: number;
  medium: number;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  departmentId: string | null;
  status: "active" | "suspended";
  homeWardId: string | null;
  emailVerified: boolean;
  prefs: {
    defaultVisibility: "public" | "private";
    notify: Record<"support" | "newInQueue" | "slaBreach", boolean>;
    pushEnabled: boolean;
  };
  stats: {
    filed: number;
    resolved: number;
    voicesAdded: number;
    supportersOnMyReports: number;
    byStatus: Partial<Record<ComplaintStatus, number>>;
  };
  unreadNotifications: number;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  categories: ComplaintCategory[];
  active: boolean;
  metrics?: {
    open: number;
    overdue: number;
    medianResolutionHours30d: number | null;
    slaCompliance30d: number | null;
  };
}

export interface GeoPoint {
  lat: number;
  lng: number;
  geohash: string;
  geohash5: string;
  geohash6: string;
  wardId: string | null;
  wardName: string | null;
  landmark?: string;
  accuracyM?: number;
}

export interface PriorityLineItem {
  key: FactorKey | "ADJ";
  label: string;
  detail: string;
  factor: number;
  weight: number;
  points: number;
}

export interface PriorityResult {
  score: number;
  band: PriorityBand;
  base: number;
  adjustment: number;
  factors: Record<FactorKey, number>;
  lineItems: PriorityLineItem[];
  weightsVersion: number;
  computedAt: string;
  provisional: boolean;
}
export type Priority = PriorityResult;

export interface Evidence {
  publicId: string;
  url: string;
  width: number;
  height: number;
  public: boolean;
}
export interface Resolution {
  note: string;
  resolvedAt: string;
  resolvedByUid: string;
  departmentId: string;
  evidence: Evidence[];
}
export interface Feedback {
  rating: Severity;
  comment?: string;
  at: string;
}

export interface Complaint {
  id: string;
  ref: string;
  cityId: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  categorySource: "user" | "ai" | "fallback" | "authority";
  categoryConfirmed: boolean;
  aiCategory: ComplaintCategory | null;
  aiConfidence: number | null;
  departmentId: string;
  departmentName: string;
  assignedToUid: string | null;
  status: ComplaintStatus;
  statusChangedAt: string;
  reopenCount: number;
  visibility: "public" | "private";
  location: GeoPoint;
  durationBucket: DurationBucket;
  affectedScale: AffectedScale;
  hazardFlags: HazardFlag[];
  reporterUid: string;
  reporterDisplayName: string;
  supporterUids: string[];
  supporterCount: number;
  followerUids: string[];
  independentReporterCount: number;
  clusterRootId: string | null;
  linkedChildIds: string[];
  pendingDuplicateCount: number;
  verifiedSeverity: Severity | null;
  priority: PriorityResult;
  slaHours: number;
  slaDueAt: string;
  aiAnalysisId: string | null;
  aiStatus: "gemini" | "fallback" | "failed" | "paused";
  evidence: Evidence[];
  resolution: Resolution | null;
  feedback: Feedback | null;
  isSynthetic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryConfig {
  category: ComplaintCategory;
  departmentId: string;
  baseSeverity: Severity;
  slaHours: number;
  timeSensitive: boolean;
  seasonMonths: number[];
}
