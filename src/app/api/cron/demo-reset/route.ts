import { type NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/server-env";
import { getAdminFirestore } from "@/server/clients/firebase-admin";
import { recordAuditLog } from "@/server/repositories/audit.repo";
import { runSeed } from "../../../../../scripts/seed/seed";

export const runtime = "nodejs";

/**
 * Nightly Vercel Cron Demo Reset (PRD Block D §4).
 * Schedule: 0 21 * * * (≈02:30 IST)
 * Protected by Authorization: Bearer CRON_SECRET.
 * Deletes isDemoSession documents, restores synthetic seed state,
 * recomputes cityMetrics & mapSnapshot, and logs to audit trail.
 */
async function handleDemoReset(req: NextRequest) {
  const env = getServerEnv();
  const authHeader = req.headers.get("authorization");

  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured on server" },
      { status: 500 },
    );
  }

  const expectedBearer = `Bearer ${env.CRON_SECRET}`;
  if (authHeader !== expectedBearer) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing CRON_SECRET" },
      { status: 401 },
    );
  }

  const firestore = getAdminFirestore();
  const nowIso = new Date().toISOString();
  let deletedCount = 0;

  try {
    // 1. Delete all demo session documents
    const collectionsToPurge = [
      "complaints",
      "publicComplaints",
      "complaintActivities",
      "duplicateSuggestions",
      "notifications",
    ];

    for (const collName of collectionsToPurge) {
      const snap = await firestore
        .collection(collName)
        .where("isDemoSession", "==", true)
        .get();

      if (!snap.empty) {
        let batch = firestore.batch();
        let count = 0;

        for (const doc of snap.docs) {
          batch.delete(doc.ref);
          count++;
          deletedCount++;

          if (count >= 400) {
            await batch.commit();
            batch = firestore.batch();
            count = 0;
          }
        }

        if (count > 0) {
          await batch.commit();
        }
      }
    }

    // 2. Restore synthetic seed state & recompute metrics/maps
    const seededCount = await runSeed();

    // 3. Write tamper-evident audit log
    await recordAuditLog({
      action: "DEMO_RESET",
      actorUid: "system-cron",
      actorEmail: "cron@civicpulse.local",
      actorRole: "admin",
      targetId: "demo-data",
      targetType: "settings",
      summary: `Nightly cron purge: deleted ${deletedCount} demo session records, restored ${seededCount} synthetic complaints, recomputed cityMetrics & mapSnapshot`,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Nightly demo reset executed successfully",
        deletedDemoDocs: deletedCount,
        seededComplaints: seededCount,
        executedAt: nowIso,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[Cron Demo Reset] Execution failed:", err);
    return NextResponse.json(
      {
        error: "Demo reset failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return handleDemoReset(req);
}

export async function GET(req: NextRequest) {
  return handleDemoReset(req);
}

