import "server-only";
import { getAdminFirestore } from "@/server/clients/firebase-admin";
import type {
  SystemSettings,
  CategoryConfig,
  ComplaintCategory,
  Weights,
  Bands,
} from "@/domain/types";
import {
  CATEGORY_CONFIG,
  DEFAULT_WEIGHTS,
  DEFAULT_BANDS,
  DUPLICATE_SETTINGS,
} from "@/domain/categories";
import { recordAuditLog } from "./audit.repo";
import type { SessionUser } from "@/server/auth/session";

export async function getSystemSettings(): Promise<SystemSettings> {
  const firestore = getAdminFirestore();

  try {
    const [weightsDoc, dupDoc, aiDoc, rateDoc] = await Promise.all([
      firestore.collection("systemSettings").doc("priorityWeights").get(),
      firestore.collection("systemSettings").doc("duplicate").get(),
      firestore.collection("systemSettings").doc("ai").get(),
      firestore.collection("systemSettings").doc("rateLimits").get(),
    ]);

    const weightsData = weightsDoc.exists ? weightsDoc.data() : null;
    const dupData = dupDoc.exists ? dupDoc.data() : null;
    const aiData = aiDoc.exists ? aiDoc.data() : null;
    const rateData = rateDoc.exists ? rateDoc.data() : null;

    return {
      weights: (weightsData?.weights as Weights) || { ...DEFAULT_WEIGHTS },
      bands: (weightsData?.bands as Bands) || { ...DEFAULT_BANDS },
      duplicates: {
        radiusM: dupData?.radiusM ?? DUPLICATE_SETTINGS.radiusM,
        windowDays: dupData?.windowDays ?? DUPLICATE_SETTINGS.windowDays,
        likely: dupData?.likely ?? DUPLICATE_SETTINGS.likely,
        possible: dupData?.possible ?? DUPLICATE_SETTINGS.possible,
      },
      ai: {
        paused: Boolean(aiData?.paused),
        dailyBudget: aiData?.dailyRequestBudget ?? 500,
        userDailyLimit: aiData?.perUserDailyAnalyses ?? 20,
      },
      rateLimits: {
        complaintsPerUserPerDay: rateData?.complaintsPerUserPerDay ?? 10,
        supportsPerUserPerDay: rateData?.supportsPerUserPerDay ?? 50,
      },
    };
  } catch {
    // Return defaults if Firestore is initializing or during setup
    return {
      weights: { ...DEFAULT_WEIGHTS },
      bands: { ...DEFAULT_BANDS },
      duplicates: {
        radiusM: DUPLICATE_SETTINGS.radiusM,
        windowDays: DUPLICATE_SETTINGS.windowDays,
        likely: DUPLICATE_SETTINGS.likely,
        possible: DUPLICATE_SETTINGS.possible,
      },
      ai: {
        paused: false,
        dailyBudget: 500,
        userDailyLimit: 20,
      },
      rateLimits: {
        complaintsPerUserPerDay: 10,
        supportsPerUserPerDay: 50,
      },
    };
  }
}

export async function updateSystemSettingsSection(
  section: "weights" | "duplicates" | "ai" | "rateLimits" | "bands",
  values: Record<string, unknown>,
  actor: SessionUser,
): Promise<SystemSettings> {
  const firestore = getAdminFirestore();

  if (section === "weights" || section === "bands") {
    const docRef = firestore.collection("systemSettings").doc("priorityWeights");
    const snap = await docRef.get();
    const current = snap.exists ? snap.data() : {};
    const before = JSON.parse(JSON.stringify(current));

    const updated = {
      ...current,
      [section]: values,
      updatedByUid: actor.uid,
      updatedAt: new Date().toISOString(),
    };
    await docRef.set(updated, { merge: true });

    await recordAuditLog({
      action: "SETTINGS_UPDATED",
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: "priorityWeights",
      targetType: "settings",
      summary: `Updated priority ${section}`,
      before,
      after: updated,
    });
  } else if (section === "duplicates") {
    const docRef = firestore.collection("systemSettings").doc("duplicate");
    const snap = await docRef.get();
    const before = snap.exists ? snap.data() : {};
    await docRef.set(values, { merge: true });

    await recordAuditLog({
      action: "SETTINGS_UPDATED",
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: "duplicate",
      targetType: "settings",
      summary: "Updated duplicate detection settings",
      before: before || null,
      after: values,
    });
  } else if (section === "ai") {
    const docRef = firestore.collection("systemSettings").doc("ai");
    const snap = await docRef.get();
    const before = snap.exists ? snap.data() : {};
    await docRef.set(values, { merge: true });

    await recordAuditLog({
      action: "SETTINGS_UPDATED",
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: "ai",
      targetType: "settings",
      summary: "Updated AI configuration",
      before: before || null,
      after: values,
    });
  } else if (section === "rateLimits") {
    const docRef = firestore.collection("systemSettings").doc("rateLimits");
    const snap = await docRef.get();
    const before = snap.exists ? snap.data() : {};
    await docRef.set(values, { merge: true });

    await recordAuditLog({
      action: "SETTINGS_UPDATED",
      actorUid: actor.uid,
      actorEmail: actor.email,
      actorRole: actor.role,
      targetId: "rateLimits",
      targetType: "settings",
      summary: "Updated rate limits",
      before: before || null,
      after: values,
    });
  }

  return getSystemSettings();
}

export async function setAiPaused(paused: boolean, actor: SessionUser): Promise<{ paused: boolean }> {
  const firestore = getAdminFirestore();
  const docRef = firestore.collection("systemSettings").doc("ai");
  const snap = await docRef.get();
  const before = snap.exists ? snap.data() : {};

  await docRef.set({ paused, updatedAt: new Date().toISOString() }, { merge: true });

  await recordAuditLog({
    action: paused ? "AI_PAUSED" : "AI_RESUMED",
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    targetId: "ai",
    targetType: "settings",
    summary: paused ? "Emergency AI kill switch engaged" : "AI inferences resumed",
    before: { paused: before?.paused ?? false },
    after: { paused },
  });

  return { paused };
}

export async function getCategoryConfigs(): Promise<Record<ComplaintCategory, CategoryConfig>> {
  const firestore = getAdminFirestore();
  try {
    const doc = await firestore.collection("systemSettings").doc("categories").get();
    if (doc.exists && doc.data()?.items) {
      return doc.data()!.items as Record<ComplaintCategory, CategoryConfig>;
    }
  } catch {
    // Fallback
  }
  return { ...CATEGORY_CONFIG };
}

export async function updateCategoryConfig(
  key: ComplaintCategory,
  config: Partial<CategoryConfig>,
  actor: SessionUser,
): Promise<CategoryConfig> {
  const firestore = getAdminFirestore();
  const docRef = firestore.collection("systemSettings").doc("categories");
  const snap = await docRef.get();
  const currentItems = snap.exists && snap.data()?.items ? (snap.data()!.items as Record<ComplaintCategory, CategoryConfig>) : { ...CATEGORY_CONFIG };
  const current = currentItems[key] || CATEGORY_CONFIG[key];

  const merged: CategoryConfig = {
    ...current,
    ...config,
  };

  currentItems[key] = merged;
  await docRef.set({ items: currentItems, updatedAt: new Date().toISOString() }, { merge: true });

  await recordAuditLog({
    action: "CATEGORY_UPDATED",
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    targetId: key,
    targetType: "category",
    summary: `Updated configuration for category ${key}`,
    before: current as unknown as Record<string, unknown>,
    after: merged as unknown as Record<string, unknown>,
  });

  return merged;
}
