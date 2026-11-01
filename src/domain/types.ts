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
  authoritiesCount?: number;
  openComplaints?: number;
  overdueComplaints?: number;
  slaComplianceRate?: number;
  metrics?: {
    open: number;
    overdue: number;
    medianResolutionHours30d: number | null;
    slaCompliance30d: number | null;
  };
}

export interface WardSummary {
  wardId: string;
  wardName: string;
  totalComplaints: number;
  openComplaints: number;
  resolvedComplaints: number;
  overdueComplaints: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  geohash: string;
  geohash5: string;
  geohash6: string;
  wardId: string | null;
  wardName: string | null;
  landmark?: string | undefined;
  accuracyM?: number | undefined;
}

export interface MapSnapshotPoint {
  id: string;
  ref: string;
  lat: number;
  lng: number;
  category: ComplaintCategory;
  band: PriorityBand;
  score: number;
  status: ComplaintStatus;
  supporters: number;
  isSynthetic: boolean;
  title: string;
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
  comment?: string | undefined;
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

export interface PublicComplaint {
  id: string;
  ref: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  departmentId: string;
  departmentName: string;
  status: ComplaintStatus;
  statusChangedAt: string;
  location: GeoPoint;
  priority: PriorityResult;
  supporterCount: number;
  independentReporterCount: number;
  createdAt: string;
}

export interface ComplaintActivity {
  id: string;
  complaintId: string;
  actorUid: string;
  actorName: string;
  actorRole: Role;
  action: string;
  note?: string | undefined;
  createdAt: string;
  visibleToReporter: boolean;
  departmentId: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  departmentId: string | null;
  status: "active" | "suspended";
  emailVerified: boolean;
  homeWardId: string | null;
  complaintsFiled: number;
  createdAt: string;
  lastSignInAt?: string | undefined;
}

export interface AuditLog {
  id: string;
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
  createdAt: string;
}

export interface SystemSettings {
  weights: Weights;
  bands: Bands;
  duplicates: {
    radiusM: number;
    windowDays: number;
    likely: number;
    possible: number;
  };
  ai: {
    paused: boolean;
    dailyBudget: number;
    userDailyLimit: number;
  };
  rateLimits: {
    complaintsPerUserPerDay: number;
    supportsPerUserPerDay: number;
  };
}

export type NotificationType =
  | "STATUS_CHANGED"
  | "ASSIGNED"
  | "RESOLVED"
  | "REOPENED"
  | "FEEDBACK_RECEIVED"
  | "SUPPORT_ADDED"
  | "DUPLICATE_LINKED"
  | "NEW_IN_QUEUE"
  | "SLA_BREACH"
  | "ROLE_CHANGED"
  | "SYSTEM";

export interface Notification {
  id: string;
  userId: string;
  complaintId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

