import * as React from "react";
import { requireRole } from "@/server/auth/require-role";
import { AppShell } from "@/components/layout/app-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");

  return (
    <AppShell role="admin" title="Administration & Governance">
      {children}
    </AppShell>
  );
}
