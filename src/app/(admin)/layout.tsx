import * as React from "react";
import { requireRole } from "@/server/auth/require-role";
import { AppShell } from "@/components/layout/app-shell";
import { ViewOnlyProvider } from "@/components/auth/view-only-context";
import { Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("admin");
  const isViewOnly = Boolean(user.viewOnly);

  return (
    <ViewOnlyProvider viewOnly={isViewOnly}>
      <AppShell role="admin" title="Administration & Governance">
        {isViewOnly && (
          <div
            role="status"
            className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-purple-200 bg-purple-50/90 p-3.5 text-xs text-purple-900 shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-200/80 text-purple-800">
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div>
                <span className="font-bold">Admin View-Only Demo:</span>{" "}
                <span>
                  You have full read access to all admin tools, audit logs, and AI monitoring. Administrative mutations are safely disabled for this judge demo.
                </span>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-purple-200/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-purple-800">
              Demo Account
            </span>
          </div>
        )}
        {children}
      </AppShell>
    </ViewOnlyProvider>
  );
}

