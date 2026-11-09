"use client";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import type { Role } from "@/domain/schemas";

export interface SessionResponse {
  ok: boolean;
  role: Role;
  home: string;
  user: {
    uid: string;
    email: string;
    displayName: string;
    role: Role;
    departmentId: string | null;
    homeWardId?: string | null;
    viewOnly?: boolean | undefined;
  };
}

/**
 * Maps Firebase Auth error codes to user-friendly messages (§UI-03, §UI-04, §UI-05).
 * Prevents account enumeration on sign-in failure.
 */
export function mapAuthError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "An unexpected error occurred. Please try again.";
  }

  const err = error as { code?: string; message?: string };
  const code = err.code || "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Sign in instead.";
    case "auth/weak-password":
      return "Use at least 8 characters with both letters and numbers.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again in a few minutes or reset your password.";
    case "auth/network-request-failed":
      return "Can't reach the server. Check your connection.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/popup-blocked":
      return "Popup was blocked by your browser. Please allow popups for this site.";
    case "ACCOUNT_SUSPENDED":
      return "Your account has been suspended. Please contact administrator support.";
    default:
      return err.message || "Authentication failed. Please verify your credentials.";
  }
}

/**
 * Client sign in with email and password + session exchange.
 */
export async function loginWithEmail(
  email: string,
  pass: string,
  next?: string | null,
): Promise<SessionResponse> {
  const auth = getFirebaseAuth();
  const trimmedEmail = email.trim();

  const cred = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
  const idToken = await cred.user.getIdToken();

  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, next: next || undefined }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 403 || data?.error?.code === "ACCOUNT_SUSPENDED") {
      await signOut(auth).catch(() => {});
      throw { code: "ACCOUNT_SUSPENDED", message: "Your account has been suspended." };
    }
    throw new Error(data?.error?.message || "Failed to establish server session.");
  }

  return res.json();
}

/**
 * Client sign in with Google Popup + session exchange.
 */
export async function loginWithGoogle(next?: string | null): Promise<SessionResponse> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const cred = await signInWithPopup(auth, provider);
  const idToken = await cred.user.getIdToken();

  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, next: next || undefined }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 403 || data?.error?.code === "ACCOUNT_SUSPENDED") {
      await signOut(auth).catch(() => {});
      throw { code: "ACCOUNT_SUSPENDED", message: "Your account has been suspended." };
    }
    throw new Error(data?.error?.message || "Failed to establish server session.");
  }

  return res.json();
}

/**
 * Client registration: creates user, updates profile, sends verification email, exchanges session.
 */
export async function registerWithEmail(params: {
  email: string;
  pass: string;
  displayName: string;
  homeWardId?: string | undefined;
}): Promise<{ user: FirebaseUser; session: SessionResponse }> {
  const auth = getFirebaseAuth();
  const trimmedEmail = params.email.trim();
  const trimmedName = params.displayName.trim();

  const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, params.pass);

  if (trimmedName) {
    await updateProfile(cred.user, { displayName: trimmedName }).catch(() => {});
  }

  // Send verification email (§UI-04)
  await sendEmailVerification(cred.user).catch((err) => {
    console.warn("Failed to send email verification:", err);
  });

  const idToken = await cred.user.getIdToken();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idToken,
      homeWardId: params.homeWardId || undefined,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message || "Failed to create session after registration.");
  }

  const session: SessionResponse = await res.json();
  return { user: cred.user, session };
}

/**
 * Request password reset email with anti-enumeration protection (§UI-05).
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  const trimmedEmail = email.trim();
  const appOrigin = typeof window !== "undefined" ? window.location.origin : "";

  try {
    await sendPasswordResetEmail(auth, trimmedEmail, {
      url: `${appOrigin}/login`,
      handleCodeInApp: false,
    });
  } catch (error: unknown) {
    const err = error as { code?: string };
    // Anti-enumeration: swallow user-not-found / invalid-email
    if (err?.code === "auth/user-not-found" || err?.code === "auth/invalid-email") {
      return;
    }
    throw error;
  }
}

/**
 * Check if the currently signed-in user's email has been verified (§UI-06).
 */
export async function checkEmailVerifiedStatus(): Promise<{
  verified: boolean;
  home?: string;
  user?: FirebaseUser | null;
}> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    return { verified: false, user: null };
  }

  await user.reload();

  if (user.emailVerified) {
    // Refresh ID token to pick up email_verified claim
    const idToken = await user.getIdToken(true);
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const session: SessionResponse = await res.json().catch(() => ({ home: "/citizen/dashboard" }));
    return { verified: true, home: session.home || "/citizen/dashboard", user };
  }

  return { verified: false, user };
}

/**
 * Resend email verification to current user.
 */
export async function resendVerification(): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No active session found. Please sign in again.");
  }
  await sendEmailVerification(user);
}

/**
 * Sign out from client Firebase Auth and clear session cookie.
 */
export async function signOutClient(): Promise<void> {
  try {
    const auth = getFirebaseAuth();
    await signOut(auth);
  } catch {
    // ignore
  }

  await fetch("/api/auth/session", {
    method: "DELETE",
  }).catch(() => {});
}
