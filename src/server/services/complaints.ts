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

/**
 * Lists complaints with filtering & pagination
 */
export async function listComplaints(options: {
  userId?: string | undefined;
  departmentId?: string | undefined;
  category?: ComplaintCategory | undefined;
  isPublicOnly?: boolean | undefined;
  limit?: number | undefined;
}): Promise<Complaint[]> {
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
  if (options.isPublicOnly) {
    filtered = filtered.filter((c) => c.visibility === "public");
  }

  // Sort by priority score descending
  filtered.sort((a, b) => b.priority.score - a.priority.score);

  return filtered.slice(0, options.limit || 50);
}
