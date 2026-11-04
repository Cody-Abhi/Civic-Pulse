import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/server-env";
import { getAdminFirestore, getAdminAuth } from "@/server/clients/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthCheckResult {
  firestore: boolean;
  auth: boolean;
  gemini: boolean;
  envOk: boolean;
  indexesHint: boolean;
}

const TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Probe timed out")), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

async function probeFirestore(): Promise<boolean> {
  try {
    const db = getAdminFirestore();
    await withTimeout(db.collection("systemSettings").limit(1).get());
    return true;
  } catch {
    return false;
  }
}

async function probeIndexesHint(): Promise<boolean> {
  try {
    const db = getAdminFirestore();
    // Composite index probe: queries requiring the composite index
    await withTimeout(
      db
        .collection("complaints")
        .where("departmentId", "==", "roads")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get(),
    );
    return true;
  } catch {
    return false;
  }
}

async function probeAuth(): Promise<boolean> {
  try {
    const auth = getAdminAuth();
    await withTimeout(auth.listUsers(1));
    return true;
  } catch {
    return false;
  }
}

async function probeGemini(apiKey?: string): Promise<boolean> {
  if (!apiKey) return false;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=1`,
      {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(): Promise<NextResponse<HealthCheckResult>> {
  let envOk = false;
  let geminiApiKey: string | undefined = undefined;

  try {
    const env = getServerEnv();
    geminiApiKey = env.GEMINI_API_KEY;
    if (
      env.APP_URL &&
      env.FIREBASE_ADMIN_PROJECT_ID &&
      env.GEMINI_API_KEY &&
      env.ANALYSIS_TOKEN_SECRET &&
      env.CRON_SECRET
    ) {
      envOk = true;
    }
  } catch {
    envOk = false;
  }

  // Probe services in parallel with strict 3-second timeouts
  const [firestore, auth, gemini] = await Promise.all([
    probeFirestore(),
    probeAuth(),
    probeGemini(geminiApiKey),
  ]);

  const indexesHint = firestore ? await probeIndexesHint() : false;

  const allHealthy = firestore && auth && gemini && envOk && indexesHint;

  return NextResponse.json(
    {
      firestore,
      auth,
      gemini,
      envOk,
      indexesHint,
    },
    {
      status: allHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
