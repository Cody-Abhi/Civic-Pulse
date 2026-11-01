import * as React from "react";
import { requireRole } from "@/server/auth/require-role";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function AuthorityLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireRole("authority");
  return <AppShell role="authority">{children}</AppShell>;
}
