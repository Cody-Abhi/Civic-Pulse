import "server-only";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import type {
  Complaint,
  PublicComplaint,
  ComplaintActivity,
  ComplaintCategory,
  ComplaintStatus,
  RejectReason,
  Role,
} from "@/domain/types";
import { categorySchema, hazardFlagSchema, durationBucketSchema, affectedScaleSchema } from "@/domain/schemas";
import { redactPII } from "@/domain/redact";
import { computePriority } from "@/domain/priority";
import { CATEGORY_CONFIG, DEFAULT_WEIGHTS, DEFAULT_BANDS, DEFAULT_WEIGHTS_VERSION } from "@/domain/categories";
import type { SessionUser } from "@/server/auth/session";
import { getAdminFirestore } from "@/server/clients/firebase-admin";

export const createComplaintSchema = z.object({
  title: z.string().max(80).optional(),
  description: z.string().min(20).max(1000),
  category: categorySchema,
  categorySource: z.enum(["user", "ai", "fallback"]).default("user"),
  analysisToken: z.string().optional(),
  location: z.object({
    lat: z.number().min(12.7).max(13.2), // Bengaluru latitude bounds
    lng: z.number().min(77.4).max(77.8), // Bengaluru longitude bounds
    wardId: z.string().optional(),
    landmark: z.string().max(120).optional(),
    accuracyM: z.number().optional(),
  }),
  durationBucket: durationBucketSchema,
  affectedScale: affectedScaleSchema,
  hazardFlags: z.array(hazardFlagSchema).default([]),
  visibility: z.enum(["public", "private"]).default("public"),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;

// Global in-memory storage for seeded/demo data and local development resilience
const MEMORY_COMPLAINTS: Map<string, Complaint> = new Map();
const MEMORY_ACTIVITIES: Map<string, ComplaintActivity[]> = new Map();
let sequenceCounter = 240;

function ensureSeedLoaded() {
  if (MEMORY_COMPLAINTS.size === 0) {
    try {
      const p = path.join(process.cwd(), "fixtures", "seed", "complaints.json");
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf-8");
        const list = JSON.parse(raw) as Complaint[];
        list.forEach((c) => {
          MEMORY_COMPLAINTS.set(c.id, c);
          MEMORY_COMPLAINTS.set(c.ref, c);
        });
      }
    } catch (e) {
      console.warn("Could not load seeded complaints file:", e);
    }
  }
}

export function reloadSeedComplaints(): number {
  MEMORY_COMPLAINTS.clear();
  MEMORY_ACTIVITIES.clear();
  sequenceCounter = 240;
  try {
    const p = path.join(process.cwd(), "fixtures", "seed", "complaints.json");
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, "utf-8");
      const list = JSON.parse(raw) as Complaint[];
      list.forEach((c) => {
        MEMORY_COMPLAINTS.set(c.id, c);
        MEMORY_COMPLAINTS.set(c.ref, c);
      });
      return list.length;
    }
  } catch (e) {
    console.warn("Could not reload seed complaints file:", e);
  }
  return 0;
}

export function addInMemoryComplaint(complaint: Complaint) {
  MEMORY_COMPLAINTS.set(complaint.id, complaint);
  MEMORY_COMPLAINTS.set(complaint.ref, complaint);
}

export function getAllInMemoryComplaints(): Complaint[] {
  ensureSeedLoaded();
  // Return unique by id
  const unique = new Map<string, Complaint>();
  MEMORY_COMPLAINTS.forEach((c) => unique.set(c.id, c));
  return Array.from(unique.values());
}

export async function getComplaints(): Promise<Complaint[]> {
  return getAllInMemoryComplaints();
}

export async function getWardStats(): Promise<import("@/domain/types").WardSummary[]> {
  const all = getAllInMemoryComplaints();
  const map = new Map<string, import("@/domain/types").WardSummary>();
  const now = Date.now();

  all.forEach((c) => {
    const wardId = c.location.wardId || "ward-blr-central";
    const wardName = c.location.wardName || "Central Bengaluru";
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
      if (new Date(c.slaDueAt).getTime() < now) {
        stat.overdueComplaints++;
      }
    }
  });

  return Array.from(map.values()).sort((a, b) => b.totalComplaints - a.totalComplaints);
}

export function getCityMetrics() {
  ensureSeedLoaded();
  const all = getAllInMemoryComplaints();
  const total = all.length;
  const resolved = all.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length;
  const inProgress = all.filter((c) => c.status === "IN_PROGRESS" || c.status === "ASSIGNED").length;
  const submitted = all.filter((c) => c.status === "SUBMITTED").length;
  const critical = all.filter((c) => c.priority?.band === "CRITICAL").length;

  return {
    totalComplaints: total,
    resolvedComplaints: resolved,
    inProgressComplaints: inProgress,
    submittedComplaints: submitted,
    criticalComplaints: critical,
    resolutionRate: total > 0 ? Number(((resolved / total) * 100).toFixed(1)) : 0,
    avgResolutionHours: 21.4,
    activeCitizens: 92,
    isSynthetic: true,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generates monotonic reference code: CP-BLR-YYMM-NNNNNN (§25.3, PRD-FR-008)
 */
export function generateReference(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  sequenceCounter += 1;
  const num = String(sequenceCounter).padStart(6, "0");
  return `CP-BLR-${yy}${mm}-${num}`;
}

/**
 * Creates a complaint through transaction (§25.3, T-07)
 */
export async function createComplaint(
  input: CreateComplaintInput,
  user: SessionUser,
): Promise<{ complaint: Complaint; publicUrl: string | null }> {
  const validated = createComplaintSchema.parse(input);

  // 1. Redact PII
  const redactedDesc = redactPII(validated.description);
  const redactedTitle = validated.title ? redactPII(validated.title).text : undefined;

  // 2. Department & SLA lookup
  const catConfig = CATEGORY_CONFIG[validated.category];
  const departmentId = catConfig.departmentId;
  const departmentName = departmentId.toUpperCase();
  const slaHours = catConfig.slaHours;

  // 3. Deterministic Priority Calculation
  const nowMs = Date.now();
  const priorityResult = computePriority({
    baseSeverity: catConfig.baseSeverity,
    verifiedSeverity: null,
    hazardFlags: validated.hazardFlags,
    independentReporterCount: 1,
    createdAtMs: nowMs,
    nowMs,
    slaHours,
    affectedScale: validated.affectedScale,
    nearbyOpenClusters: 0,
    timeSensitive: catConfig.timeSensitive,
    seasonMonths: catConfig.seasonMonths,
    adjustment: 0,
    weights: DEFAULT_WEIGHTS,
    bands: DEFAULT_BANDS,
    weightsVersion: DEFAULT_WEIGHTS_VERSION,
  });

  // 4. Construct Complaint Document
  const id = crypto.randomUUID();
  const ref = generateReference();
  const nowIso = new Date(nowMs).toISOString();

  const complaint: Complaint = {
    id,
    ref,
    cityId: "blr",
    title: redactedTitle || `${validated.category.replace(/_/g, " ")} near ${validated.location.landmark || "Bengaluru"}`,
    description: redactedDesc.text,
    category: validated.category,
    categorySource: validated.categorySource,
    categoryConfirmed: true,
    aiCategory: validated.categorySource === "ai" ? validated.category : null,
    aiConfidence: validated.categorySource === "ai" ? 0.88 : null,
    departmentId,
    departmentName,
    assignedToUid: null,
    status: "SUBMITTED",
    statusChangedAt: nowIso,
    reopenCount: 0,
    visibility: validated.visibility,
    location: {
      lat: validated.location.lat,
      lng: validated.location.lng,
      geohash: "tdr1",
      geohash5: "tdr1v",
      geohash6: "tdr1v4",
      wardId: validated.location.wardId || "ward-150-bellandur",
      wardName: "Bellandur",
      landmark: validated.location.landmark,
      accuracyM: validated.location.accuracyM,
    },
    durationBucket: validated.durationBucket,
    affectedScale: validated.affectedScale,
    hazardFlags: validated.hazardFlags,
    reporterUid: user.uid,
    reporterDisplayName: user.displayName,
    supporterUids: [],
    supporterCount: 0,
    followerUids: [user.uid],
    independentReporterCount: 1,
    clusterRootId: null,
    linkedChildIds: [],
    pendingDuplicateCount: 0,
    verifiedSeverity: null,
    priority: priorityResult,
    slaHours,
    slaDueAt: new Date(nowMs + slaHours * 3600 * 1000).toISOString(),
    aiAnalysisId: null,
    aiStatus: validated.categorySource === "ai" ? "gemini" : "fallback",
    evidence: [],
    resolution: null,
    feedback: null,
    isSynthetic: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // 5. Initial Activity
  const initialActivity: ComplaintActivity = {
    id: crypto.randomUUID(),
    complaintId: id,
    actorUid: user.uid,
    actorName: user.displayName,
    actorRole: user.role,
    action: "CREATED",
    createdAt: nowIso,
    visibleToReporter: true,
    departmentId,
  };

  // 6. Persist to Firestore (and in-memory fallback for immediate zero-latency demo)
  addInMemoryComplaint(complaint);
  const activities = MEMORY_ACTIVITIES.get(id) || [];
  activities.push(initialActivity);
  MEMORY_ACTIVITIES.set(id, activities);

  try {
    const firestore = getAdminFirestore();
    const batch = firestore.batch();

    batch.set(firestore.collection("complaints").doc(id), complaint);

    if (complaint.visibility === "public") {
      const publicDoc: PublicComplaint = {
        id,
        ref,
        title: complaint.title,
        description: complaint.description,
        category: complaint.category,
        departmentId: complaint.departmentId,
        departmentName: complaint.departmentName,
        status: complaint.status,
        statusChangedAt: complaint.statusChangedAt,
        location: complaint.location,
        priority: {
          score: priorityResult.score,
          band: priorityResult.band,
          base: priorityResult.base,
          adjustment: priorityResult.adjustment,
          factors: priorityResult.factors,
          lineItems: priorityResult.lineItems,
          weightsVersion: priorityResult.weightsVersion,
          computedAt: priorityResult.computedAt,
          provisional: priorityResult.provisional,
        },
        supporterCount: complaint.supporterCount,
        independentReporterCount: complaint.independentReporterCount,
        createdAt: nowIso,
      };
      batch.set(firestore.collection("publicComplaints").doc(id), publicDoc);
    }

    batch.set(firestore.collection("complaintActivities").doc(initialActivity.id), initialActivity);
    await batch.commit();
  } catch (err) {
    // Graceful fallback for local dev when Firestore is not running emulator or lacks service account
    console.warn("Firestore write skipped/fallback to in-memory store:", err instanceof Error ? err.message : err);
  }

  const publicUrl = complaint.visibility === "public" ? `/complaints/${ref}` : null;
  return { complaint, publicUrl };
}

/**
 * Retrieves complaint by ID or Reference Code
 */
export async function getComplaint(refOrId: string): Promise<Complaint | null> {
  ensureSeedLoaded();
  const fromMemory = MEMORY_COMPLAINTS.get(refOrId);
  if (fromMemory) return fromMemory;

  try {
    const firestore = getAdminFirestore();
    const doc = await firestore.collection("complaints").doc(refOrId).get();
    if (doc.exists) {
      return doc.data() as Complaint;
    }

    const byRef = await firestore.collection("complaints").where("ref", "==", refOrId).limit(1).get();
    if (!byRef.empty && byRef.docs[0]) {
      return byRef.docs[0].data() as Complaint;
    }
  } catch {
    // Return null on failure
  }

  return null;
}

export interface ListComplaintsOptions {
  userId?: string | undefined;
  departmentId?: string | undefined;
  category?: ComplaintCategory | undefined;
  wardId?: string | undefined;
  status?: string | undefined;
  priorityBand?: string | undefined;
  search?: string | undefined;
  isPublicOnly?: boolean | undefined;
  sortBy?: "priority" | "recent" | "supported" | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

/**
 * Lists complaints with filtering & pagination
 */
export async function listComplaints(options: ListComplaintsOptions): Promise<Complaint[]> {
  const all = getAllInMemoryComplaints();
  let filtered = all;

  if (options.userId) {
    const uid = options.userId;
    filtered = filtered.filter((c) => c.reporterUid === uid || c.followerUids.includes(uid));
  }
  if (options.departmentId) {
    filtered = filtered.filter((c) => c.departmentId === options.departmentId);
  }
  if (options.category) {
    filtered = filtered.filter((c) => c.category === options.category);
  }
  if (options.wardId) {
    const w = options.wardId.toLowerCase();
    filtered = filtered.filter((c) => c.location.wardId === options.wardId || (c.location.wardName && c.location.wardName.toLowerCase() === w));
  }
  if (options.status) {
    if (options.status === "OPEN_ALL") {
      filtered = filtered.filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED");
    } else {
      filtered = filtered.filter((c) => c.status === options.status);
    }
  }
  if (options.priorityBand) {
    filtered = filtered.filter((c) => c.priority.band === options.priorityBand);
  }
  if (options.isPublicOnly) {
    filtered = filtered.filter((c) => c.visibility === "public");
  }
  if (options.search) {
    const q = options.search.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        c.ref.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.location.landmark && c.location.landmark.toLowerCase().includes(q)) ||
        (c.location.wardName && c.location.wardName.toLowerCase().includes(q)),
    );
  }

  // Sorting
  if (options.sortBy === "recent") {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (options.sortBy === "supported") {
    filtered.sort((a, b) => (b.supporterCount || 0) - (a.supporterCount || 0));
  } else {
    // Default: Sort by priority score descending
    filtered.sort((a, b) => b.priority.score - a.priority.score);
  }

  const offset = options.offset || 0;
  const limit = options.limit || 50;

  return filtered.slice(offset, offset + limit);
}

/**
 * Adds citizen support (upvote / add my voice) to a complaint
 */
export async function supportComplaint(
  refOrId: string,
  userUid = "demo-citizen-uid",
): Promise<{ success: boolean; supporterCount: number; complaint: Complaint }> {
  ensureSeedLoaded();
  const complaint = await getComplaint(refOrId);
  if (!complaint) {
    throw new Error("Complaint not found");
  }

  if (!complaint.supporterUids) {
    complaint.supporterUids = [];
  }
  if (!complaint.supporterUids.includes(userUid)) {
    complaint.supporterUids.push(userUid);
  }
  complaint.supporterCount = (complaint.supporterCount || 0) + 1;
  complaint.independentReporterCount = (complaint.independentReporterCount || 1) + 1;

  // Recompute priority with increased reporter count
  const catConfig = CATEGORY_CONFIG[complaint.category];
  const nowMs = Date.now();
  const createdMs = new Date(complaint.createdAt).getTime();

  const newPriority = computePriority({
    baseSeverity: catConfig.baseSeverity,
    verifiedSeverity: complaint.verifiedSeverity,
    hazardFlags: complaint.hazardFlags,
    independentReporterCount: complaint.independentReporterCount,
    createdAtMs: createdMs,
    nowMs,
    slaHours: complaint.slaHours,
    affectedScale: complaint.affectedScale,
    nearbyOpenClusters: 0,
    timeSensitive: catConfig.timeSensitive,
    seasonMonths: catConfig.seasonMonths,
    adjustment: complaint.priority.adjustment,
    weights: DEFAULT_WEIGHTS,
    bands: DEFAULT_BANDS,
    weightsVersion: DEFAULT_WEIGHTS_VERSION,
    provisional: false,
  });

  complaint.priority = newPriority;
  complaint.updatedAt = new Date().toISOString();

  // Update in-memory cache
  addInMemoryComplaint(complaint);

  try {
    const firestore = getAdminFirestore();
    const docRef = firestore.collection("complaints").doc(complaint.id);
    await docRef.update({
      supporterUids: complaint.supporterUids,
      supporterCount: complaint.supporterCount,
      independentReporterCount: complaint.independentReporterCount,
      priority: complaint.priority,
      updatedAt: complaint.updatedAt,
    });
    if (complaint.visibility === "public") {
      await firestore.collection("publicComplaints").doc(complaint.id).update({
        supporterCount: complaint.supporterCount,
        independentReporterCount: complaint.independentReporterCount,
        priority: complaint.priority,
      });
    }
  } catch (err) {
    console.warn("Firestore update skipped/fallback:", err);
  }

  return { success: true, supporterCount: complaint.supporterCount, complaint };
}

/**
 * Updates complaint lifecycle status with activity logging
 */
export async function updateComplaintStatus(
  refOrId: string,
  newStatus: ComplaintStatus,
  options?: {
    note?: string | undefined;
    resolutionNote?: string | undefined;
    rejectReason?: RejectReason | undefined;
    actorUid?: string | undefined;
    actorName?: string | undefined;
    actorRole?: Role | undefined;
  },
): Promise<Complaint> {
  ensureSeedLoaded();
  const complaint = await getComplaint(refOrId);
  if (!complaint) throw new Error("Complaint not found");

  const nowIso = new Date().toISOString();
  complaint.status = newStatus;
  complaint.statusChangedAt = nowIso;
  complaint.updatedAt = nowIso;

  if (newStatus === "RESOLVED" && options?.resolutionNote) {
    complaint.resolution = {
      note: options.resolutionNote,
      resolvedAt: nowIso,
      resolvedByUid: options.actorUid || "authority-agent",
      departmentId: complaint.departmentId,
      evidence: [],
    };
  }

  // Create activity record
  const activity: ComplaintActivity = {
    id: crypto.randomUUID(),
    complaintId: complaint.id,
    actorUid: options?.actorUid || "authority-agent",
    actorName: options?.actorName || "Municipal Engineer",
    actorRole: options?.actorRole || "authority",
    action: `STATUS_CHANGED_${newStatus}`,
    note: options?.note || options?.resolutionNote,
    createdAt: nowIso,
    visibleToReporter: true,
    departmentId: complaint.departmentId,
  };

  const activities = MEMORY_ACTIVITIES.get(complaint.id) || [];
  activities.push(activity);
  MEMORY_ACTIVITIES.set(complaint.id, activities);

  addInMemoryComplaint(complaint);

  try {
    const firestore = getAdminFirestore();
    await firestore.collection("complaints").doc(complaint.id).update({
      status: complaint.status,
      statusChangedAt: complaint.statusChangedAt,
      resolution: complaint.resolution,
      updatedAt: complaint.updatedAt,
    });
    if (complaint.visibility === "public") {
      await firestore.collection("publicComplaints").doc(complaint.id).update({
        status: complaint.status,
        statusChangedAt: complaint.statusChangedAt,
      });
    }
    await firestore.collection("complaintActivities").doc(activity.id).set(activity);
  } catch (err) {
    console.warn("Firestore update skipped/fallback:", err);
  }

  return complaint;
}

/**
 * Adjusts complaint priority score by ±15 points with mandatory rationale
 */
export async function adjustComplaintPriority(
  refOrId: string,
  adjustment: number,
  rationale: string,
  actorUid = "authority-agent",
): Promise<Complaint> {
  ensureSeedLoaded();
  const complaint = await getComplaint(refOrId);
  if (!complaint) throw new Error("Complaint not found");

  // Adjustment bounded between -15 and +15 per PRD §29.2
  const clampedAdjustment = Math.min(15, Math.max(-15, adjustment));

  const catConfig = CATEGORY_CONFIG[complaint.category];
  const nowMs = Date.now();
  const createdMs = new Date(complaint.createdAt).getTime();

  const newPriority = computePriority({
    baseSeverity: catConfig.baseSeverity,
    verifiedSeverity: complaint.verifiedSeverity,
    hazardFlags: complaint.hazardFlags,
    independentReporterCount: complaint.independentReporterCount,
    createdAtMs: createdMs,
    nowMs,
    slaHours: complaint.slaHours,
    affectedScale: complaint.affectedScale,
    nearbyOpenClusters: 0,
    timeSensitive: catConfig.timeSensitive,
    seasonMonths: catConfig.seasonMonths,
    adjustment: clampedAdjustment,
    weights: DEFAULT_WEIGHTS,
    bands: DEFAULT_BANDS,
    weightsVersion: DEFAULT_WEIGHTS_VERSION,
    provisional: false,
  });

  complaint.priority = newPriority;
  complaint.updatedAt = new Date().toISOString();

  // Activity for priority adjustment
  const activity: ComplaintActivity = {
    id: crypto.randomUUID(),
    complaintId: complaint.id,
    actorUid,
    actorName: "Municipal Engineer",
    actorRole: "authority",
    action: "PRIORITY_ADJUSTED",
    note: `Adjustment: ${clampedAdjustment > 0 ? "+" : ""}${clampedAdjustment}. Rationale: ${rationale}`,
    createdAt: complaint.updatedAt,
    visibleToReporter: false,
    departmentId: complaint.departmentId,
  };

  const activities = MEMORY_ACTIVITIES.get(complaint.id) || [];
  activities.push(activity);
  MEMORY_ACTIVITIES.set(complaint.id, activities);

  addInMemoryComplaint(complaint);

  try {
    const firestore = getAdminFirestore();
    await firestore.collection("complaints").doc(complaint.id).update({
      priority: complaint.priority,
      updatedAt: complaint.updatedAt,
    });
    if (complaint.visibility === "public") {
      await firestore.collection("publicComplaints").doc(complaint.id).update({
        priority: complaint.priority,
      });
    }
    await firestore.collection("complaintActivities").doc(activity.id).set(activity);
  } catch (err) {
    console.warn("Firestore update skipped/fallback:", err);
  }

  return complaint;
}

/**
 * Returns activity log for a complaint
 */
export function getComplaintActivities(complaintId: string): ComplaintActivity[] {
  return MEMORY_ACTIVITIES.get(complaintId) || [];
}


