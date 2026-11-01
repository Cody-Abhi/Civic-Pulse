import { AppShell } from "@/components/layout/app-shell";

/**
 * Dashboard shell layout — wraps citizen, authority, and admin routes.
 * Employs responsive AppShell (264px sidebar / 72px rail / mobile bottom tab & drawer).
 */
export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell role="citizen">{children}</AppShell>;
}
