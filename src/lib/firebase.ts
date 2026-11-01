import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { clientEnv, isFirebaseClientConfigured } from "@/lib/env";

function buildFirebaseOptions(): FirebaseOptions {
  const options: FirebaseOptions = {};
  if (clientEnv.FIREBASE_API_KEY) options.apiKey = clientEnv.FIREBASE_API_KEY;
  if (clientEnv.FIREBASE_AUTH_DOMAIN) options.authDomain = clientEnv.FIREBASE_AUTH_DOMAIN;
  if (clientEnv.FIREBASE_PROJECT_ID) options.projectId = clientEnv.FIREBASE_PROJECT_ID;
  if (clientEnv.FIREBASE_APP_ID) options.appId = clientEnv.FIREBASE_APP_ID;
  if (clientEnv.FIREBASE_MESSAGING_SENDER_ID) options.messagingSenderId = clientEnv.FIREBASE_MESSAGING_SENDER_ID;
  if (clientEnv.FIREBASE_STORAGE_BUCKET) options.storageBucket = clientEnv.FIREBASE_STORAGE_BUCKET;
  if (clientEnv.FIREBASE_MEASUREMENT_ID) options.measurementId = clientEnv.FIREBASE_MEASUREMENT_ID;
  if (clientEnv.FIREBASE_DATABASE_URL) options.databaseURL = clientEnv.FIREBASE_DATABASE_URL;
  return options;
}

export const firebaseConfig: FirebaseOptions = buildFirebaseOptions();

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let emulatorsConnected = false;

if (isFirebaseClientConfigured()) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  if (clientEnv.USE_EMULATORS && !emulatorsConnected && typeof window !== "undefined") {
    try {
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
      connectFirestoreEmulator(db, "localhost", 8080);
      emulatorsConnected = true;
    } catch {
      // Emulators may already be connected in fast refresh
    }
  }
}

/**
 * Lazily initialize Firebase Analytics only on the client side when supported.
 */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined" || !app) {
    return null;
  }
  const supported = await isSupported();
  if (supported) {
    return getAnalytics(app);
  }
  return null;
}

export { app, auth, db };
