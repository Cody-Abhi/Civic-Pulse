import "server-only";
import * as crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/server/clients/firebase-admin";
import type {
  Complaint,
  PublicComplaint,
  ComplaintActivity,
  ComplaintCategory,
  ComplaintStatus,
  RejectReason,
  Role,
  Severity,
  PriorityResult,
} from "@/domain/types";
import {
  categorySchema,
  hazardFlagSchema,
  durationBucketSchema,
  affectedScaleSchema,
} from "@/domain/schemas";
import { z } from "zod";
import { redactPII } from "@/domain/redact";
import { computePriority } from "@/domain/priority";
import {
  CATEGORY_CONFIG,
  DEFAULT_WEIGHTS,
  DEFAULT_BANDS,
  DEFAULT_WEIGHTS_VERSION,
} from "@/domain/categories";
import { validateTransition } from "@/domain/transitions";
import type { SessionUser } from "@/server/auth/session";

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

// Compact point representation for mapSnapshots/current (§23.2, §30.6)
export interface MapSnapshotPoint {
  id: string;
  ref: string;
  lat: number;
  lng: number;
  category: string;
  band: string;
  score: number;
  status: string;
  supporters: number;
  isSynthetic: boolean;
  title: string;
}

export async function getComplaintById(refOrId: string): Promise<Complaint | null> {
  const firestore = getAdminFirestore();
  const doc = await firestore.collection("complaints").doc(refOrId).get();
  if (doc.exists) {
    return doc.data() as Complaint;
  }

  const byRef = await firestore
    .collection("complaints")
    .where("ref", "==", refOrId)
    .limit(1)
    .get();

  if (!byRef.empty && byRef.docs[0]) {
    return byRef.docs[0].data() as Complaint;
  }

  return null;
}

export async function getPublicComplaint(refOrId: string): Promise<PublicComplaint | null> {
  const firestore = getAdminFirestore();
  const doc = await firestore.collection("publicComplaints").doc(refOrId).get();
  if (doc.exists) {
    return doc.data() as PublicComplaint;
  }

  const byRef = await firestore
    .collection("publicComplaints")
    .where("ref", "==", refOrId)
    .limit(1)
    .get();

  if (!byRef.empty && byRef.docs[0]) {
    return byRef.docs[0].data() as PublicComplaint;
  }

  return null;
}

export async function getComplaintActivities(complaintId: string): Promise<ComplaintActivity[]> {
  const firestore = getAdminFirestore();
  const snap = await firestore
    .collection("complaintActivities")
    .where("complaintId", "==", complaintId)
    .orderBy("createdAt", "asc")
    .get();

  return snap.docs.map((d) => d.data() as ComplaintActivity);
}

export async function listComplaints(options: ListComplaintsOptions = {}): Promise<Complaint[]> {
  const firestore = getAdminFirestore();
  let query: FirebaseFirestore.Query = firestore.collection("complaints");

  if (options.departmentId) {
    query = query.where("departmentId", "==", options.departmentId);
  }
  if (options.category) {
    query = query.where("category", "==", options.category);
  }
  if (options.isPublicOnly) {
    query = query.where("visibility", "==", "public");
  }
  if (options.status && options.status !== "OPEN_ALL") {
    query = query.where("status", "==", options.status);
  }

  const snap = await query.get();
  let results = snap.docs.map((d) => d.data() as Complaint);

  if (options.userId) {
    const uid = options.userId;
    results = results.filter(
      (c) => c.reporterUid === uid || (c.followerUids && c.followerUids.includes(uid)),
    );
  }

  if (options.status === "OPEN_ALL") {
    results = results.filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED");
  }

  if (options.wardId) {
    const w = options.wardId.toLowerCase();
    results = results.filter(
      (c) =>
        c.location.wardId === options.wardId ||
        (c.location.wardName && c.location.wardName.toLowerCase() === w),
    );
  }

  if (options.priorityBand) {
    results = results.filter((c) => c.priority?.band === options.priorityBand);
  }

  if (options.search) {
    const q = options.search.toLowerCase().trim();
    results = results.filter(
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
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (options.sortBy === "supported") {
    results.sort((a, b) => (b.supporterCount || 0) - (a.supporterCount || 0));
  } else {
    // Default: Sort by priority score descending
    results.sort((a, b) => (b.priority?.score || 0) - (a.priority?.score || 0));
  }

  const offset = options.offset || 0;
  const limit = options.limit || 50;

  return results.slice(offset, offset + limit);
}

export async function createComplaint(
  input: CreateComplaintInput,
  user: SessionUser,
  idempotencyKey?: string,
): Promise<{ complaint: Complaint; publicUrl: string | null }> {
  const validated = createComplaintSchema.parse(input);
  const firestore = getAdminFirestore();

  // 1. Redact PII
  const redactedDesc = redactPII(validated.description);
  const redactedTitle = validated.title ? redactPII(validated.title).text : undefined;

  // 2. Department & SLA lookup
  const catConfig = CATEGORY_CONFIG[validated.category];
  const departmentId = catConfig.departmentId;
  const departmentName = departmentId.toUpperCase();
  const slaHours = catConfig.slaHours;

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const id = crypto.randomUUID();

  // Deterministic priority calculation (§29.2)
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

  let linkedAnalysisId: string | null = null;
  if (validated.analysisToken) {
    try {
      const payload = Buffer.from(
        validated.analysisToken.split(".")[0] || "",
        "base64url",
      ).toString("utf-8");
      const [aId] = payload.split(":");
      if (aId) linkedAnalysisId = aId;
    } catch {
      // ignore token parse errors
    }
  }

  // Transaction for atomic creation per PRD §25.3
  const createdComplaint = await firestore.runTransaction(async (tx) => {
    // A. Check idempotency key
    if (idempotencyKey) {
      const idempDocRef = firestore.collection("idempotencyKeys").doc(`${user.uid}_${idempotencyKey}`);
      const idempSnap = await tx.get(idempDocRef);
      if (idempSnap.exists) {
        const stored = idempSnap.data()?.response;
        if (stored?.complaint) {
          return stored.complaint as Complaint;
        }
      }
    }

    // B. Monotonic reference code generation (CP-BLR-YYMM-NNNNNN)
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const counterDocRef = firestore.collection("counters").doc(`complaintSeq-${yy}${mm}`);
    const counterSnap = await tx.get(counterDocRef);
    let seq = 241;
    if (counterSnap.exists) {
      seq = (counterSnap.data()?.value || 0) + 1;
    }
    tx.set(counterDocRef, { value: seq }, { merge: true });
    const ref = `CP-BLR-${yy}${mm}-${String(seq).padStart(6, "0")}`;

    // C. User quota / stats increment
    const userDocRef = firestore.collection("users").doc(user.uid);
    tx.set(
      userDocRef,
      {
        stats: {
          filed: FieldValue.increment(1),
        },
        updatedAt: nowIso,
      },
      { merge: true },
    );

    // D. Construct Complaint Document
    const complaint: Complaint = {
      id,
      ref,
      cityId: "blr",
      title:
        redactedTitle ||
        `${validated.category.replace(/_/g, " ")} near ${validated.location.landmark || "Bengaluru"}`,
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
      aiAnalysisId: linkedAnalysisId,
      aiStatus: validated.categorySource === "ai" ? "gemini" : "fallback",
      evidence: [],
      resolution: null,
      feedback: null,
      isSynthetic: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    tx.set(firestore.collection("complaints").doc(id), complaint);

    // E. Public Projection (if public)
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
        priority: priorityResult,
        supporterCount: 0,
        independentReporterCount: 1,
        createdAt: nowIso,
      };
      tx.set(firestore.collection("publicComplaints").doc(id), publicDoc);
    }

    // F. Initial Activity
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
    tx.set(firestore.collection("complaintActivities").doc(initialActivity.id), initialActivity);

    // G. Metrics updates
    const totalsRef = firestore.collection("cityMetrics").doc("totals");
    tx.set(
      totalsRef,
      {
        totalComplaints: FieldValue.increment(1),
        open: FieldValue.increment(1),
        submittedComplaints: FieldValue.increment(1),
        [`openByCategory.${complaint.category}`]: FieldValue.increment(1),
        [`openByDepartment.${complaint.departmentId}`]: FieldValue.increment(1),
        [`openByBand.${complaint.priority.band}`]: FieldValue.increment(1),
        updatedAt: nowIso,
      },
      { merge: true },
    );

    const deptMetricsRef = firestore.collection("departmentMetrics").doc(complaint.departmentId);
    tx.set(
      deptMetricsRef,
      {
        open: FieldValue.increment(1),
        [`openByBand.${complaint.priority.band}`]: FieldValue.increment(1),
        updatedAt: nowIso,
      },
      { merge: true },
    );

    // H. Map Snapshot point upsert
    if (complaint.visibility === "public") {
      const mapSnapRef = firestore.collection("mapSnapshots").doc("current");
      const mapSnap = await tx.get(mapSnapSnapRef(mapSnapRef));
      const currentPoints = (mapSnap.exists ? mapSnap.data()?.points : []) as MapSnapshotPoint[];

      const newPoint: MapSnapshotPoint = {
        id: complaint.id,
        ref: complaint.ref,
        lat: Number(complaint.location.lat.toFixed(5)),
        lng: Number(complaint.location.lng.toFixed(5)),
        category: complaint.category,
        band: complaint.priority.band,
        score: complaint.priority.score,
        status: complaint.status,
        supporters: complaint.supporterCount,
        isSynthetic: complaint.isSynthetic,
        title: complaint.title.slice(0, 40),
      };

      currentPoints.push(newPoint);
      tx.set(
        mapSnapRef,
        {
          points: currentPoints,
          count: currentPoints.length,
          updatedAt: nowIso,
          version: FieldValue.increment(1),
        },
        { merge: true },
      );
    }

    // I. Store idempotency response
    if (idempotencyKey) {
      const idempDocRef = firestore.collection("idempotencyKeys").doc(`${user.uid}_${idempotencyKey}`);
      tx.set(idempDocRef, {
        route: "POST /api/complaints",
        response: { complaint, publicUrl: complaint.visibility === "public" ? `/complaints/${complaint.ref}` : null },
        createdAt: nowIso,
      });
    }

    return complaint;
  });

  const publicUrl = createdComplaint.visibility === "public" ? `/complaints/${createdComplaint.ref}` : null;
  return { complaint: createdComplaint, publicUrl };
}

function mapSnapSnapRef(ref: FirebaseFirestore.DocumentReference) {
  return ref;
}

export async function transitionComplaint(
  id: string,
  options: {
    to: ComplaintStatus;
    expectedStatus: ComplaintStatus;
    note?: string | undefined;
    resolutionNote?: string | undefined;
    departmentId?: string | undefined;
    assignedToUid?: string | null | undefined;
    rejectReason?: RejectReason | undefined;
    actorUid: string;
    actorName: string;
    actorRole: Role;
  },
): Promise<Complaint> {
  const firestore = getAdminFirestore();

  return firestore.runTransaction(async (tx) => {
    const docRef = firestore.collection("complaints").doc(id);
    const snap = await tx.get(docRef);
    if (!snap.exists) {
      throw new Error("NOT_FOUND");
    }

    const complaint = snap.data() as Complaint;

    if (complaint.status !== options.expectedStatus) {
      const err = new Error("INVALID_TRANSITION");
      (err as unknown as { current: ComplaintStatus }).current = complaint.status;
      throw err;
    }

    // Validate transition state machine (§21.5)
    const validation = validateTransition(
      {
        uid: options.actorUid,
        role: options.actorRole,
        departmentId: complaint.departmentId,
      },
      {
        status: complaint.status,
        departmentId: complaint.departmentId,
        reporterUid: complaint.reporterUid,
        reopenCount: complaint.reopenCount || 0,
        resolvedAtMs: complaint.resolution?.resolvedAt
          ? new Date(complaint.resolution.resolvedAt).getTime()
          : null,
        visibility: complaint.visibility,
      },
      {
        to: options.to,
        nowMs: Date.now(),
        expectedStatus: options.expectedStatus,
        reason: options.rejectReason,
        note: options.note,
        resolutionNote: options.resolutionNote,
        targetDepartmentId: options.departmentId,
        assignedToUid: options.assignedToUid || undefined,
      },
    );

    if (!validation.ok) {
      const err = new Error(validation.message);
      (err as unknown as { code: string }).code = validation.code;
      throw err;
    }

    const nowIso = new Date().toISOString();
    const oldStatus = complaint.status;
    complaint.status = options.to;
    complaint.statusChangedAt = nowIso;
    complaint.updatedAt = nowIso;

    if (options.departmentId) {
      complaint.departmentId = options.departmentId;
    }
    if (options.assignedToUid !== undefined) {
      complaint.assignedToUid = options.assignedToUid;
    }

    if (options.to === "RESOLVED" && (options.resolutionNote || options.note)) {
      complaint.resolution = {
        note: options.resolutionNote || options.note || "Resolved by department",
        resolvedAt: nowIso,
        resolvedByUid: options.actorUid,
        departmentId: complaint.departmentId,
        evidence: [],
      };
    }

    if (options.to === "REOPENED") {
      complaint.reopenCount = (complaint.reopenCount || 0) + 1;
    }

    tx.update(docRef, {
      status: complaint.status,
      statusChangedAt: complaint.statusChangedAt,
      departmentId: complaint.departmentId,
      assignedToUid: complaint.assignedToUid,
      resolution: complaint.resolution,
      reopenCount: complaint.reopenCount,
      updatedAt: complaint.updatedAt,
    });

    if (complaint.visibility === "public") {
      const pubRef = firestore.collection("publicComplaints").doc(complaint.id);
      tx.set(
        pubRef,
        {
          status: complaint.status,
          statusChangedAt: complaint.statusChangedAt,
          departmentId: complaint.departmentId,
        },
        { merge: true },
      );
    }

    // Activity logging
    const activityId = crypto.randomUUID();
    const activity: ComplaintActivity = {
      id: activityId,
      complaintId: complaint.id,
      actorUid: options.actorUid,
      actorName: options.actorName,
      actorRole: options.actorRole,
      action: `STATUS_CHANGED_${options.to}`,
      note: options.note || options.resolutionNote,
      createdAt: nowIso,
      visibleToReporter: true,
      departmentId: complaint.departmentId,
    };
    tx.set(firestore.collection("complaintActivities").doc(activityId), activity);

    // Update metrics counters
    const totalsRef = firestore.collection("cityMetrics").doc("totals");
    if (options.to === "RESOLVED" || options.to === "CLOSED") {
      if (oldStatus !== "RESOLVED" && oldStatus !== "CLOSED") {
        tx.set(
          totalsRef,
          {
            open: FieldValue.increment(-1),
            resolvedComplaints: FieldValue.increment(1),
            updatedAt: nowIso,
          },
          { merge: true },
        );
      }
    } else if (options.to === "REOPENED") {
      tx.set(
        totalsRef,
        {
          open: FieldValue.increment(1),
          resolvedComplaints: FieldValue.increment(-1),
          updatedAt: nowIso,
        },
        { merge: true },
      );
    }

    // Update mapSnapshot
    const mapSnapRef = firestore.collection("mapSnapshots").doc("current");
    const mapSnap = await tx.get(mapSnapRef);
    if (mapSnap.exists) {
      let points = (mapSnap.data()?.points || []) as MapSnapshotPoint[];
      if (options.to === "CLOSED" || options.to === "REJECTED") {
        points = points.filter((p) => p.id !== complaint.id);
      } else {
        const pt = points.find((p) => p.id === complaint.id);
        if (pt) {
          pt.status = complaint.status;
        }
      }
      tx.set(mapSnapRef, { points, count: points.length, updatedAt: nowIso }, { merge: true });
    }

    return complaint;
  });
}

export async function supportComplaint(
  refOrId: string,
  user: SessionUser,
): Promise<{ supporterCount: number; independentReporterCount: number; priority: PriorityResult; complaint: Complaint }> {
  const firestore = getAdminFirestore();

  return firestore.runTransaction(async (tx) => {
    let docRef = firestore.collection("complaints").doc(refOrId);
    let snap = await tx.get(docRef);

    if (!snap.exists) {
      const byRef = await firestore
        .collection("complaints")
        .where("ref", "==", refOrId)
        .limit(1)
        .get();
      if (byRef.empty || !byRef.docs[0]) {
        throw new Error("Complaint not found");
      }
      docRef = byRef.docs[0].ref;
      snap = byRef.docs[0];
    }

    const complaint = snap.data() as Complaint;

    if (complaint.reporterUid === user.uid) {
      throw new Error("Cannot support your own report");
    }

    if (complaint.supporterUids && complaint.supporterUids.includes(user.uid)) {
      const err = new Error("ALREADY_SUPPORTED");
      throw err;
    }

    const supporterUids = [...(complaint.supporterUids || []), user.uid];
    const followerUids = Array.from(new Set([...(complaint.followerUids || []), user.uid]));
    const supporterCount = (complaint.supporterCount || 0) + 1;
    const independentReporterCount = (complaint.independentReporterCount || 1) + 1;

    // Recompute priority
    const catConfig = CATEGORY_CONFIG[complaint.category];
    const nowMs = Date.now();
    const createdMs = new Date(complaint.createdAt).getTime();

    const newPriority = computePriority({
      baseSeverity: catConfig.baseSeverity,
      verifiedSeverity: complaint.verifiedSeverity,
      hazardFlags: complaint.hazardFlags,
      independentReporterCount,
      createdAtMs: createdMs,
      nowMs,
      slaHours: complaint.slaHours,
      affectedScale: complaint.affectedScale,
      nearbyOpenClusters: 0,
      timeSensitive: catConfig.timeSensitive,
      seasonMonths: catConfig.seasonMonths,
      adjustment: complaint.priority?.adjustment || 0,
      weights: DEFAULT_WEIGHTS,
      bands: DEFAULT_BANDS,
      weightsVersion: DEFAULT_WEIGHTS_VERSION,
      provisional: false,
    });

    const nowIso = new Date().toISOString();
    complaint.supporterUids = supporterUids;
    complaint.followerUids = followerUids;
    complaint.supporterCount = supporterCount;
    complaint.independentReporterCount = independentReporterCount;
    complaint.priority = newPriority;
    complaint.updatedAt = nowIso;

    tx.update(docRef, {
      supporterUids,
      followerUids,
      supporterCount,
      independentReporterCount,
      priority: newPriority,
      updatedAt: nowIso,
    });

    if (complaint.visibility === "public") {
      tx.set(
        firestore.collection("publicComplaints").doc(complaint.id),
        {
          supporterCount,
          independentReporterCount,
          priority: newPriority,
        },
        { merge: true },
      );
    }

    // Activity
    const actId = crypto.randomUUID();
    tx.set(firestore.collection("complaintActivities").doc(actId), {
      id: actId,
      complaintId: complaint.id,
      actorUid: user.uid,
      actorName: user.displayName,
      actorRole: user.role,
      action: "SUPPORT_ADDED",
      note: "Citizen supported this issue",
      createdAt: nowIso,
      visibleToReporter: true,
      departmentId: complaint.departmentId,
    });

    // Update user stats
    tx.set(
      firestore.collection("users").doc(user.uid),
      {
        stats: {
          voicesAdded: FieldValue.increment(1),
        },
        updatedAt: nowIso,
      },
      { merge: true },
    );

    // Update mapSnapshot
    const mapSnapRef = firestore.collection("mapSnapshots").doc("current");
    const mapSnap = await tx.get(mapSnapRef);
    if (mapSnap.exists) {
      const points = (mapSnap.data()?.points || []) as MapSnapshotPoint[];
      const pt = points.find((p) => p.id === complaint.id);
      if (pt) {
        pt.band = newPriority.band;
        pt.score = newPriority.score;
        pt.supporters = supporterCount;
      }
      tx.set(mapSnapRef, { points, updatedAt: nowIso }, { merge: true });
    }

    return {
      supporterCount,
      independentReporterCount,
      priority: newPriority,
      complaint,
    };
  });
}

export async function adjustComplaintPriority(
  refOrId: string,
  adjustment: number,
  rationale: string,
  actor: SessionUser,
): Promise<Complaint> {
  const firestore = getAdminFirestore();
  const complaint = await getComplaintById(refOrId);
  if (!complaint) throw new Error("Complaint not found");

  const clampedAdjustment = Math.min(15, Math.max(-15, adjustment));
  const catConfig = CATEGORY_CONFIG[complaint.category];
  const nowMs = Date.now();
  const createdMs = new Date(complaint.createdAt).getTime();

  const newPriority = computePriority({
    baseSeverity: catConfig.baseSeverity,
    verifiedSeverity: complaint.verifiedSeverity,
    hazardFlags: complaint.hazardFlags,
    independentReporterCount: complaint.independentReporterCount || 1,
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

  const nowIso = new Date().toISOString();
  complaint.priority = newPriority;
  complaint.updatedAt = nowIso;

  const docRef = firestore.collection("complaints").doc(complaint.id);
  await docRef.update({
    priority: complaint.priority,
    updatedAt: nowIso,
  });

  if (complaint.visibility === "public") {
    await firestore.collection("publicComplaints").doc(complaint.id).update({
      priority: complaint.priority,
    });
  }

  const actId = crypto.randomUUID();
  await firestore.collection("complaintActivities").doc(actId).set({
    id: actId,
    complaintId: complaint.id,
    actorUid: actor.uid,
    actorName: actor.displayName,
    actorRole: actor.role,
    action: "PRIORITY_ADJUSTED",
    note: `Adjustment: ${clampedAdjustment > 0 ? "+" : ""}${clampedAdjustment}. Rationale: ${rationale}`,
    createdAt: nowIso,
    visibleToReporter: false,
    departmentId: complaint.departmentId,
  });

  return complaint;
}

export async function setVerifiedSeverity(
  refOrId: string,
  severity: Severity,
  actor: SessionUser,
): Promise<Complaint> {
  const firestore = getAdminFirestore();
  const complaint = await getComplaintById(refOrId);
  if (!complaint) throw new Error("Complaint not found");

  complaint.verifiedSeverity = severity;
  const nowMs = Date.now();
  const createdMs = new Date(complaint.createdAt).getTime();
  const catConfig = CATEGORY_CONFIG[complaint.category];

  const newPriority = computePriority({
    baseSeverity: catConfig.baseSeverity,
    verifiedSeverity: severity,
    hazardFlags: complaint.hazardFlags,
    independentReporterCount: complaint.independentReporterCount || 1,
    createdAtMs: createdMs,
    nowMs,
    slaHours: complaint.slaHours,
    affectedScale: complaint.affectedScale,
    nearbyOpenClusters: 0,
    timeSensitive: catConfig.timeSensitive,
    seasonMonths: catConfig.seasonMonths,
    adjustment: complaint.priority?.adjustment || 0,
    weights: DEFAULT_WEIGHTS,
    bands: DEFAULT_BANDS,
    weightsVersion: DEFAULT_WEIGHTS_VERSION,
    provisional: false,
  });

  const nowIso = new Date().toISOString();
  complaint.priority = newPriority;
  complaint.updatedAt = nowIso;

  await firestore.collection("complaints").doc(complaint.id).update({
    verifiedSeverity: severity,
    priority: newPriority,
    updatedAt: nowIso,
  });

  if (complaint.visibility === "public") {
    await firestore.collection("publicComplaints").doc(complaint.id).update({
      priority: newPriority,
    });
  }

  const actId = crypto.randomUUID();
  await firestore.collection("complaintActivities").doc(actId).set({
    id: actId,
    complaintId: complaint.id,
    actorUid: actor.uid,
    actorName: actor.displayName,
    actorRole: actor.role,
    action: "SEVERITY_VERIFIED",
    note: `Authority verified severity updated to level ${severity}/5`,
    createdAt: nowIso,
    visibleToReporter: true,
    departmentId: complaint.departmentId,
  });

  return complaint;
}
