import "server-only";
import { cookies } from "next/headers";
import type { Role } from "@/domain/schemas";
import { getServerEnv } from "@/lib/server-env";
import { getAdminAuth, getAdminFirestore } from "@/server/clients/firebase-admin";

export interface SessionUser {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  departmentId: string | null;
  status: "active" | "suspended";
  emailVerified: boolean;
  homeWardId: string | null;
}

const DEMO_USERS: Record<string, SessionUser> = {
  "citizen@demo.civicpulse.invalid": {
    uid: "demo-citizen-uid",
    email: "citizen@demo.civicpulse.invalid",
    displayName: "Aarav Patel",
    role: "citizen",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: "ward-150-bellandur",
  },
  "roads@demo.civicpulse.invalid": {
    uid: "demo-authority-uid",
    email: "roads@demo.civicpulse.invalid",
    displayName: "K. Suresh (EE Roads)",
    role: "authority",
    departmentId: "roads",
    status: "active",
    emailVerified: true,
    homeWardId: "ward-150-bellandur",
  },
  "admin@demo.civicpulse.invalid": {
    uid: "demo-admin-uid",
    email: "admin@demo.civicpulse.invalid",
    displayName: "Civic Administrator",
    role: "admin",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: null,
  },
};

/**
 * Validates the session cookie from incoming request headers.
 * Supports production Firebase Auth session cookies and demo mock sessions in dev.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const env = getServerEnv();
  const sessionCookie = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    if (env.DEMO_MODE) {
      return DEMO_USERS["citizen@demo.civicpulse.invalid"] || null;
    }
    return null;
  }

  // Check demo user cookie tokens
  if (sessionCookie.startsWith("demo:")) {
    const email = sessionCookie.replace("demo:", "");
    return DEMO_USERS[email] || null;
  }

  try {
    const auth = getAdminAuth();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    if (decodedClaims.status === "suspended") {
      return null;
    }

    const firestore = getAdminFirestore();
    const userDoc = await firestore.collection("users").doc(decodedClaims.uid).get();
    const userData = userDoc.data();

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || "",
      displayName: userData?.displayName || decodedClaims.name || "Citizen",
      role: (decodedClaims.role || userData?.role || "citizen") as Role,
      departmentId: (decodedClaims.departmentId || userData?.departmentId || null) as string | null,
      status: (decodedClaims.status || userData?.status || "active") as "active" | "suspended",
      emailVerified: Boolean(decodedClaims.email_verified),
      homeWardId: (userData?.homeWardId || null) as string | null,
    };
  } catch {
    return null;
  }
}

/**
 * Creates and sets the session cookie on the response.
 */
export async function createSessionCookie(
  idTokenOrDemoEmail: string,
): Promise<{ user: SessionUser; cookieValue: string; maxAgeSeconds: number }> {
  const env = getServerEnv();
  const maxAgeSeconds = env.SESSION_MAX_AGE_DAYS * 24 * 60 * 60;

  if (idTokenOrDemoEmail.startsWith("demo:")) {
    const email = idTokenOrDemoEmail.replace("demo:", "");
    const user = DEMO_USERS[email];
    if (!user) throw new Error("Demo user not found");
    return {
      user,
      cookieValue: `demo:${email}`,
      maxAgeSeconds,
    };
  }

  const auth = getAdminAuth();
  const sessionCookie = await auth.createSessionCookie(idTokenOrDemoEmail, {
    expiresIn: maxAgeSeconds * 1000,
  });

  const decodedClaims = await auth.verifySessionCookie(sessionCookie);
  const user: SessionUser = {
    uid: decodedClaims.uid,
    email: decodedClaims.email || "",
    displayName: decodedClaims.name || "Citizen",
    role: (decodedClaims.role as Role) || "citizen",
    departmentId: (decodedClaims.departmentId as string) || null,
    status: (decodedClaims.status as "active" | "suspended") || "active",
    emailVerified: Boolean(decodedClaims.email_verified),
    homeWardId: null,
  };

  return {
    user,
    cookieValue: sessionCookie,
    maxAgeSeconds,
  };
}
