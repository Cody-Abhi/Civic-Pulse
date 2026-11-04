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

/**
 * Validates the session cookie from incoming request headers using Firebase Admin SDK.
 * Checks revocation and verifies user status.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const env = getServerEnv();
  const sessionCookie = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
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

    if (userData?.status === "suspended") {
      return null;
    }

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || "",
      displayName: (userData?.displayName as string) || (decodedClaims.name as string) || "Citizen",
      role: ((decodedClaims.role as Role) || (userData?.role as Role) || "citizen") as Role,
      departmentId: ((decodedClaims.departmentId as string) || (userData?.departmentId as string) || null) as string | null,
      status: ((decodedClaims.status as "active" | "suspended") || (userData?.status as "active" | "suspended") || "active") as "active" | "suspended",
      emailVerified: true, // auto-verified
      homeWardId: ((userData?.homeWardId as string) || null) as string | null,
    };
  } catch {
    return null;
  }
}

/**
 * Creates and sets the session cookie on the response from a valid Firebase ID token.
 */
export async function createSessionCookie(
  idToken: string,
): Promise<{ user: SessionUser; cookieValue: string; maxAgeSeconds: number }> {
  const env = getServerEnv();
  const maxAgeSeconds = env.SESSION_MAX_AGE_DAYS * 24 * 60 * 60;

  const auth = getAdminAuth();
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: maxAgeSeconds * 1000,
  });

  const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
  const firestore = getAdminFirestore();
  const userDocRef = firestore.collection("users").doc(decodedClaims.uid);
  const userDoc = await userDocRef.get();
  let userData = userDoc.data();

  // If user document does not exist (e.g. Google Sign-In or direct client registration), provision it
  if (!userDoc.exists) {
    const role: Role = (decodedClaims.role as Role) || "citizen";
    const nowIso = new Date().toISOString();
    const newUser = {
      uid: decodedClaims.uid,
      email: decodedClaims.email || "",
      displayName: (decodedClaims.name as string) || (decodedClaims.email ? decodedClaims.email.split("@")[0] : "Citizen"),
      role,
      departmentId: (decodedClaims.departmentId as string) || null,
      status: "active" as const,
      homeWardId: null,
      emailVerified: Boolean(decodedClaims.email_verified),
      prefs: {
        defaultVisibility: "public" as const,
        notify: { support: true, newInQueue: true, slaBreach: true },
        pushEnabled: false,
      },
      stats: {
        filed: 0,
        resolved: 0,
        voicesAdded: 0,
        supportersOnMyReports: 0,
        byStatus: {},
      },
      unreadNotifications: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await userDocRef.set(newUser);
    userData = newUser;

    // Ensure custom claims are set for RBAC
    if (!decodedClaims.role) {
      await auth.setCustomUserClaims(decodedClaims.uid, {
        role: "citizen",
        departmentId: null,
        status: "active",
      });
    }
  }

  // Account suspension check
  if (decodedClaims.status === "suspended" || userData?.status === "suspended") {
    throw new Error("ACCOUNT_SUSPENDED");
  }

  const user: SessionUser = {
    uid: decodedClaims.uid,
    email: decodedClaims.email || "",
    displayName: (userData?.displayName as string) || (decodedClaims.name as string) || "Citizen",
    role: ((userData?.role as Role) || (decodedClaims.role as Role) || "citizen") as Role,
    departmentId: ((userData?.departmentId as string) || (decodedClaims.departmentId as string) || null) as string | null,
    status: ((userData?.status as "active" | "suspended") || "active") as "active" | "suspended",
    emailVerified: true, // auto-verified
    homeWardId: (userData?.homeWardId as string) || null,
  };

  return {
    user,
    cookieValue: sessionCookie,
    maxAgeSeconds,
  };
}
