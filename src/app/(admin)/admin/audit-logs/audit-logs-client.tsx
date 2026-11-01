"use client";

import * as React from "react";
import { Download, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuditLog } from "@/domain/types";

interface AuditLogsClientProps {
  initialLogs: AuditLog[];
}

export function AuditLogsClient({ initialLogs }: AuditLogsClientProps) {
  const [logs] = React.useState<AuditLog[]>(initialLogs);
  const [actionFilter, setActionFilter] = React.useState("all");
  const [targetFilter, setTargetFilter] = React.useState("all");
  const [actorSearch, setActorSearch] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const filteredLogs = React.useMemo(() => {
    return logs.filter((l) => {
      if (actionFilter !== "all" && l.action !== actionFilter) return false;
      if (targetFilter !== "all" && l.targetType !== targetFilter) return false;
      if (actorSearch) {
        const q = actorSearch.toLowerCase();
        if (!l.actorEmail.toLowerCase().includes(q) && !l.summary.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [logs, actionFilter, targetFilter, actorSearch]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Filters and CSV Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:flex-1">
          <div>
            <label htmlFor="search-audit-actor" className="mb-1 block text-xs font-medium text-muted-foreground">
              Search actor / summary
            </label>
            <input
              id="search-audit-actor"
              type="text"
              placeholder="Filter by email or details..."
              value={actorSearch}
              onChange={(e) => setActorSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="filter-audit-action" className="mb-1 block text-xs font-medium text-muted-foreground">
              Action type
            </label>
            <select
              id="filter-audit-action"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All actions</option>
              <option value="ROLE_CHANGED">Role changed</option>
              <option value="USER_SUSPENDED">User suspended</option>
              <option value="USER_REACTIVATED">User reactivated</option>
              <option value="DEPARTMENT_UPDATED">Department updated</option>
              <option value="CATEGORY_UPDATED">Category updated</option>
              <option value="SETTINGS_UPDATED">Settings updated</option>
              <option value="AI_PAUSED">AI paused</option>
              <option value="AI_RESUMED">AI resumed</option>
              <option value="DEMO_RESET">Demo reset</option>
              <option value="SYSTEM_SEED">System seed</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-audit-target" className="mb-1 block text-xs font-medium text-muted-foreground">
              Target type
            </label>
            <select
              id="filter-audit-target"
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All targets</option>
              <option value="user">User</option>
              <option value="complaint">Complaint</option>
              <option value="department">Department</option>
              <option value="category">Category</option>
              <option value="settings">Settings</option>
            </select>
          </div>
        </div>

        <a href="/api/admin/audit-logs/export" download className="self-end sm:self-auto">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </a>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-border bg-surface-card p-5 shadow-xs">
        <div className="overflow-x-auto focus:outline-none focus:ring-1 focus:ring-primary rounded-md" tabIndex={0} role="region" aria-label="Audit events register table">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-medium text-muted-foreground">
                <th className="w-8 pb-3"></th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Action</th>
                <th className="pb-3">Actor</th>
                <th className="pb-3">Target</th>
                <th className="pb-3">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log) => {
                const isExpanded = expandedId === log.id;
                const hasDiff = Boolean(log.before || log.after);
                return (
                  <React.Fragment key={log.id}>
                    <tr
                      className={`hover:bg-muted/40 ${hasDiff ? "cursor-pointer" : ""}`}
                      onClick={() => hasDiff && toggleExpand(log.id)}
                    >
                      <td className="py-3 text-muted-foreground">
                        {hasDiff && (
                          isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                        )}
                      </td>
                      <td className="py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="py-3 font-mono text-xs font-semibold text-foreground">
                        {log.action}
                      </td>
                      <td className="py-3 text-xs">
                        <div className="font-medium text-foreground">{log.actorEmail}</div>
                        <div className="text-[11px] uppercase text-muted-foreground">{log.actorRole}</div>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                          {log.targetType}:{log.targetId}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-foreground">{log.summary}</td>
                    </tr>

                    {/* Expandable JSON Diff */}
                    {isExpanded && hasDiff && (
                      <tr className="bg-muted/20">
                        <td colSpan={6} className="p-4">
                          <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                            {log.before && (
                              <div className="rounded-lg border border-border bg-surface p-3">
                                <span className="font-semibold text-muted-foreground">State Before:</span>
                                <pre className="mt-2 overflow-x-auto font-mono text-[11px] text-foreground">
                                  {JSON.stringify(log.before, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.after && (
                              <div className="rounded-lg border border-border bg-surface p-3">
                                <span className="font-semibold text-primary">State After:</span>
                                <pre className="mt-2 overflow-x-auto font-mono text-[11px] text-foreground">
                                  {JSON.stringify(log.after, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
