import "server-only";
import { getAdminFirestore, getAdminAuth } from "@/server/clients/firebase-admin";
import type { User, AdminUser, Role } from "@/domain/types";
import { recordAuditLog } from "./audit.repo";
import type { SessionUser } from "@/server/auth/session";

export interface ListUsersOptions {
  search?: string;
  role?: Role | "all";
  departmentId?: string | "all";
  status?: "active" | "suspended" | "all";
  page?: number;
  limit?: number;
}

export async function getUserById(uid: string): Promise<User | null> {
  const firestore = getAdminFirestore();
  const snap = await firestore.collection("users").doc(uid).get();
  if (!snap.exists) return null;
  return snap.data() as User;
}

export async function listAdminUsers(options: ListUsersOptions = {}): Promise<{
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const firestore = getAdminFirestore();
  const { search, role, departmentId, status, page = 1, limit = 20 } = options;

  let query: FirebaseFirestore.Query = firestore.collection("users");

  if (role && role !== "all") {
    query = query.where("role", "==", role);
  }
  if (departmentId && departmentId !== "all") {
    query = query.where("departmentId", "==", departmentId);
  }
  if (status && status !== "all") {
    query = query.where("status", "==", status);
  }

  // Firestore requires index on composite filters; retrieve and filter in memory if searching
  const snap = await query.get();
  let users = snap.docs.map((d) => {
    const data = d.data() as User;
    return {
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      departmentId: data.departmentId,
      status: data.status,
      emailVerified: data.emailVerified,
      homeWardId: data.homeWardId,
      complaintsFiled: data.stats?.filed || 0,
      createdAt: data.createdAt,
      lastSignInAt: data.updatedAt,
    } as AdminUser;
  });

  if (search) {
    const q = search.toLowerCase();
    users = users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.departmentId && u.departmentId.toLowerCase().includes(q)),
    );
  }

  const total = users.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const paginated = users.slice(start, start + limit);

  return {
    users: paginated,
    total,
    page,
    totalPages,
  };
}

export async function updateUserRole(
  uid: string,
  newRole: Role,
  departmentId: string | null,
  actor: SessionUser,
  reason = "Administrative role change",
): Promise<AdminUser> {
  const firestore = getAdminFirestore();
  const auth = getAdminAuth();

  const userDocRef = firestore.collection("users").doc(uid);
  const userSnap = await userDocRef.get();
  if (!userSnap.exists) {
    throw new Error("USER_NOT_FOUND");
  }

  const user = userSnap.data() as User;

  // Guard against demoting the last active admin (§UI-24)
  if (user.role === "admin" && newRole !== "admin") {
    const adminSnap = await firestore
      .collection("users")
      .where("role", "==", "admin")
      .where("status", "==", "active")
      .get();
    if (adminSnap.size <= 1) {
      throw new Error("LAST_ADMIN");
    }
  }

  const before = { role: user.role, departmentId: user.departmentId };
  const targetDept = newRole === "authority" ? departmentId : null;

  // Update Firebase Auth custom claims and revoke refresh tokens (§25.3)
  try {
    await auth.setCustomUserClaims(uid, {
      role: newRole,
      departmentId: targetDept,
      status: user.status,
      v: Date.now(),
    });
    await auth.revokeRefreshTokens(uid);
  } catch (authErr) {
    console.error("Auth custom claims update error:", authErr);
  }

  const updatedAt = new Date().toISOString();
  await userDocRef.update({
    role: newRole,
    departmentId: targetDept,
    updatedAt,
  });

  // Adjust authority counts on departments if applicable
  if (user.departmentId && user.departmentId !== targetDept) {
    try {
      await firestore.collection("departments").doc(user.departmentId).update({
        authoritiesCount: FirebaseFirestore.FieldValue.increment(-1),
      });
    } catch {
      // Non-fatal if department doc absent
    }
  }
  if (targetDept) {
    try {
      await firestore.collection("departments").doc(targetDept).update({
        authoritiesCount: FirebaseFirestore.FieldValue.increment(1),
      });
    } catch {
      // Non-fatal if department doc absent
    }
  }

  await recordAuditLog({
    action: "ROLE_CHANGED",
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    targetId: user.uid,
    targetType: "user",
    summary: `Changed role of ${user.displayName} to ${newRole}${targetDept ? ` (${targetDept})` : ""}`,
    before,
    after: { role: newRole, departmentId: targetDept },
    reason,
  });

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: newRole,
    departmentId: targetDept,
    status: user.status,
    emailVerified: user.emailVerified,
    homeWardId: user.homeWardId,
    complaintsFiled: user.stats?.filed || 0,
    createdAt: user.createdAt,
    lastSignInAt: updatedAt,
  };
}

export async function updateUserStatus(
  uid: string,
  newStatus: "active" | "suspended",
  reason = "Administrative review",
  actor: SessionUser,
): Promise<AdminUser> {
  const firestore = getAdminFirestore();
  const auth = getAdminAuth();

  const userDocRef = firestore.collection("users").doc(uid);
  const userSnap = await userDocRef.get();
  if (!userSnap.exists) {
    throw new Error("USER_NOT_FOUND");
  }

  const user = userSnap.data() as User;

  // Guard against suspending the last active admin
  if (user.role === "admin" && newStatus === "suspended") {
    const adminSnap = await firestore
      .collection("users")
      .where("role", "==", "admin")
      .where("status", "==", "active")
      .get();
    if (adminSnap.size <= 1) {
      throw new Error("LAST_ADMIN");
    }
  }

  const before = { status: user.status };

  // Set custom user claims with new status and revoke refresh tokens (§25.3, §36)
  try {
    await auth.setCustomUserClaims(uid, {
      role: user.role,
      departmentId: user.departmentId,
      status: newStatus,
      v: Date.now(),
    });
    await auth.revokeRefreshTokens(uid);
  } catch (authErr) {
    console.error("Auth status claims update error:", authErr);
  }

  const updatedAt = new Date().toISOString();
  await userDocRef.update({
    status: newStatus,
    updatedAt,
  });

  await recordAuditLog({
    action: newStatus === "suspended" ? "USER_SUSPENDED" : "USER_REACTIVATED",
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    targetId: user.uid,
    targetType: "user",
    summary: `${newStatus === "suspended" ? "Suspended" : "Reactivated"} user ${user.displayName}`,
    before,
    after: { status: newStatus },
    reason,
  });

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    departmentId: user.departmentId,
    status: newStatus,
    emailVerified: user.emailVerified,
    homeWardId: user.homeWardId,
    complaintsFiled: user.stats?.filed || 0,
    createdAt: user.createdAt,
    lastSignInAt: updatedAt,
  };
}
