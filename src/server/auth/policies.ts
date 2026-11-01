import "server-only";
import type { SessionUser } from "./session";
import type { ComplaintStatus } from "@/domain/types";

export interface ComplaintPolicySubject {
  reporterUid?: string;
  departmentId?: string;
  status?: ComplaintStatus;
  visibility?: "public" | "private";
}

/**
 * Pure authorization policies (§21.1).
 * Centralizes all role, department, and ownership decisions.
 * No inline role or department checks in route handlers.
 */
export const policies = {
  /**
   * Can an actor view a complaint?
   * Public complaints can be read by anyone (including anonymous).
   * Private complaints can only be read by the reporter, authorities in the same department, or admins.
   */
  canReadComplaint(user: SessionUser | null, complaint: ComplaintPolicySubject): boolean {
    if (complaint.visibility === "public") return true;
    if (!user) return false;
    if (user.status === "suspended") return false;
    if (user.role === "admin") return true;
    if (user.role === "authority" && user.departmentId === complaint.departmentId) return true;
    if (user.role === "citizen" && user.uid === complaint.reporterUid) return true;
    return false;
  },

  /**
   * Can an actor transition a complaint's status?
   * Admins can transition any complaint.
   * Authority officers can only transition complaints assigned to their department.
   * Citizens can only withdraw their own reports.
   */
  canTransitionComplaint(user: SessionUser, complaint: ComplaintPolicySubject): boolean {
    if (user.status === "suspended") return false;
    if (user.role === "admin") return true;
    if (user.role === "authority" && user.departmentId === complaint.departmentId) return true;
    if (user.role === "citizen" && user.uid === complaint.reporterUid) return true;
    return false;
  },

  /**
   * Can an actor perform a ±15 priority override or set verified severity?
   * Restricted to supervisors/admins and authorities in the owning department.
   */
  canAdjustPriority(user: SessionUser, complaint: ComplaintPolicySubject): boolean {
    if (user.status === "suspended") return false;
    if (user.role === "admin") return true;
    if (user.role === "authority" && user.departmentId === complaint.departmentId) return true;
    return false;
  },

  /**
   * Can an actor access department-scoped queues, metrics, or maps?
   * Admins can access all departments.
   * Authority staff can only access their assigned department.
   */
  canAccessDepartment(user: SessionUser, departmentId: string): boolean {
    if (user.status === "suspended") return false;
    if (user.role === "admin") return true;
    if (user.role === "authority" && user.departmentId === departmentId) return true;
    return false;
  },

  /**
   * Can an actor manage user accounts, roles, or suspensions?
   */
  canManageUsers(user: SessionUser): boolean {
    return user.status === "active" && user.role === "admin";
  },

  /**
   * Can an actor view system-wide AI telemetry, inference logs, or circuit breaker?
   */
  canViewTelemetry(user: SessionUser): boolean {
    return user.status === "active" && user.role === "admin";
  },

  /**
   * Can an actor manage departments or categories?
   */
  canManageDepartments(user: SessionUser): boolean {
    return user.status === "active" && user.role === "admin";
  },

  /**
   * Can an actor modify global system weights, bands, or AI pause switches?
   */
  canManageSettings(user: SessionUser): boolean {
    return user.status === "active" && user.role === "admin";
  },
};
