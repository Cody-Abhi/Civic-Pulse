import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@/domain/schemas";
import { getSessionUser, type SessionUser } from "./session";

export function getRoleHome(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "authority":
      return "/authority/dashboard";
    case "citizen":
    default:
      return "/citizen/dashboard";
  }
}

/**
 * Server layout guard (§13, §24).
 * Verifies session cookie with Admin SDK, checks role + status.
 * Redirects unauthenticated requests to /login and forbidden roles to role home.
 */
export async function requireRole(
  allowedRoles: Role | Role[],
): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "suspended") {
    redirect("/403?reason=suspended");
  }

  const allowedList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!allowedList.includes(user.role)) {
    redirect(getRoleHome(user.role));
  }

  return user;
}
