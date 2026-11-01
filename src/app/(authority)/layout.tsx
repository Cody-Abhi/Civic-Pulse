import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function AuthorityLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell role="authority">{children}</AppShell>;
}
