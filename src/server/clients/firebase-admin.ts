import "server-only";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getServerEnv } from "@/lib/server-env";

let adminApp: App | null = null;

/**
 * Initializes and returns the Firebase Admin SDK singleton.
 * Validates server credentials lazily upon first use.
 */
export function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    adminApp = existingApps[0];
    return adminApp;
  }

  const env = getServerEnv();

  if (env.FIREBASE_ADMIN_CLIENT_EMAIL && env.FIREBASE_ADMIN_PRIVATE_KEY) {
    adminApp = initializeApp({
      credential: cert({
        projectId: env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY,
      }),
    });
  } else {
    adminApp = initializeApp({
      projectId: env.FIREBASE_ADMIN_PROJECT_ID,
    });
  }

  return adminApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

let adminFirestore: Firestore | null = null;

export function getAdminFirestore(): Firestore {
  if (adminFirestore) {
    return adminFirestore;
  }
  adminFirestore = getFirestore(getAdminApp());
  try {
    adminFirestore.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Settings may already be configured on this Firestore instance
  }
  return adminFirestore;
}
