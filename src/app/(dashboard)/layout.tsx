import * as React from "react";
import { requireRole } from "@/server/auth/require-role";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Dashboard shell layout — wraps citizen portal routes.
 * Employs responsive AppShell (264px sidebar / 72px rail / mobile bottom tab & drawer).
 */
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole("citizen");
  return <AppShell role="citizen">{children}</AppShell>;
}
