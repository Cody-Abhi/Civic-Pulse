import { NextResponse } from "next/server";
import * as crypto from "crypto";
import { withApi, ApiError } from "@/server/http/with-api";
import { getAdminFirestore, getAdminAuth } from "@/server/clients/firebase-admin";
import { recordAuditLog } from "@/server/repositories/audit.repo";
import { z } from "zod";

export const runtime = "nodejs";

const patchMeSchema = z.object({
  displayName: z.string().min(2).max(60).optional(),
  homeWardId: z.string().optional(),
  prefs: z
    .object({
      defaultVisibility: z.enum(["public", "private"]).optional(),
      notifyStatusChanges: z.boolean().optional(),
      notifySupportAdded: z.boolean().optional(),
      notifyWeeklyDigest: z.boolean().optional(),
    })
    .optional(),
});

type PatchMeInput = z.infer<typeof patchMeSchema>;

export const GET = withApi(
  {},
  async (_req, { user }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
    }

    const firestore = getAdminFirestore();
    const userDoc = await firestore.collection("users").doc(user.uid).get();

    return NextResponse.json({
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        departmentId: user.departmentId,
        homeWardId: user.homeWardId,
        unreadNotifications: userDoc.data()?.unreadNotifications || 0,
        prefs: userDoc.data()?.prefs || {},
        stats: userDoc.data()?.stats || {},
        createdAt: userDoc.data()?.createdAt,
      },
    });
  },
);

export const PATCH = withApi<PatchMeInput>(
  {
    schema: patchMeSchema,
  },
  async (_req, { user, body }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
    }

    const firestore = getAdminFirestore();
    const userRef = firestore.collection("users").doc(user.uid);
    const nowIso = new Date().toISOString();

    const updates: Record<string, unknown> = {
      updatedAt: nowIso,
    };

    if (body.displayName) {
      updates.displayName = body.displayName;
    }
    if (body.homeWardId !== undefined) {
      updates.homeWardId = body.homeWardId;
    }
    if (body.prefs) {
      updates.prefs = body.prefs;
    }

    await userRef.set(updates, { merge: true });

    // Also update Auth profile if displayName changed
    if (body.displayName) {
      try {
        const auth = getAdminAuth();
        await auth.updateUser(user.uid, { displayName: body.displayName });
      } catch (err) {
        console.warn("Auth displayName update warning:", err);
      }
    }

    return NextResponse.json({ success: true, message: "Profile updated successfully" });
  },
);

export const DELETE = withApi(
  {
    roles: ["citizen"],
  },
  async (_req, { user }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
    }

    const firestore = getAdminFirestore();
    const auth = getAdminAuth();
    const nowIso = new Date().toISOString();

    const hashedUid = `deleted:${crypto.createHash("sha256").update(user.uid).digest("hex").slice(0, 12)}`;

    // 1. Anonymise citizen complaints (PRD §36.4)
    const complaintsSnap = await firestore
      .collection("complaints")
      .where("reporterUid", "==", user.uid)
      .get();

    const batch = firestore.batch();
    for (const doc of complaintsSnap.docs) {
      batch.update(doc.ref, {
        reporterUid: hashedUid,
        reporterDisplayName: "Former citizen",
        updatedAt: nowIso,
      });
    }

    // 2. Delete user's notifications
    const notifsSnap = await firestore
      .collection("notifications")
      .where("userId", "==", user.uid)
      .get();

    for (const doc of notifsSnap.docs) {
      batch.delete(doc.ref);
    }

    // 3. Delete user doc
    batch.delete(firestore.collection("users").doc(user.uid));

    await batch.commit();

    // 4. Delete Auth user
    try {
      await auth.deleteUser(user.uid);
    } catch (err) {
      console.warn("Auth deleteUser warning:", err);
    }

    // 5. Audit log deletion (keeps only hashed uid for GDPR compliance)
    await recordAuditLog({
      actorUid: hashedUid,
      actorEmail: `${hashedUid}@deleted.invalid`,
      actorRole: "citizen",
      action: "ACCOUNT_DELETED",
      targetId: hashedUid,
      targetType: "user",
      summary: `Citizen account deleted under GDPR; ${complaintsSnap.docs.length} complaints anonymised.`,
    });

    return NextResponse.json({
      success: true,
      message: "Account and personal data successfully deleted and complaints anonymised.",
    });
  },
);
