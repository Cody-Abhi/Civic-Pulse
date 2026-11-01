import * as React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MetricStrip, type MetricStripItem } from "@/components/data/metric-strip";
import { ChartFrame } from "@/components/data/chart-frame";
import { DemoBadge } from "@/components/ui/demo-badge";
import { Button } from "@/components/ui/button";
import { getCityMetrics, getComplaints } from "@/server/services/complaints";
import {
  listAdminUsers,
  getAdminDepartments,
  getAuditLogs,
  getAiMonitoringMetrics,
} from "@/server/services/admin";

export default async function AdminDashboardPage() {
  const metrics = getCityMetrics();
  const complaints = await getComplaints();
  const { total: totalUsers } = listAdminUsers();
  const departments = await getAdminDepartments();
  const recentLogs = getAuditLogs({ limit: 8 });
  const aiMetrics = getAiMonitoringMetrics();

  const openComplaints = complaints.filter(
    (c) => c.status !== "RESOLVED" && c.status !== "REJECTED",
  );
  const overdueCount = openComplaints.filter(
    (c) => c.priority.score >= 70 || c.reopenCount > 0,
  ).length;

  const metricItems: MetricStripItem[] = [
    {
      label: "Platform users",
      value: totalUsers,
      hint: "Admins, authorities & citizens",
    },
    {
      label: "Total grievances",
      value: metrics.totalComplaints,
      hint: "Seeded test corpus",
    },
    {
      label: "Active open queue",
      value: openComplaints.length,
      hint: `${metrics.inProgressComplaints} in progress`,
    },
    {
      label: "SLA breached",
      value: overdueCount,
      delta: { value: "Action required", isPositive: false },
    },
    {
      label: "AI fallback rate",
      value: `${aiMetrics.fallbackRate24h}%`,
      hint: "Target < 5%",
    },
    {
      label: "Gemini requests",
      value: `${aiMetrics.totalRequestsToday} / ${aiMetrics.dailyBudget}`,
      hint: "Daily rate quota",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform overview"
        description="City-wide operations, municipal department workloads, system health, and AI telemetry."
        meta={<DemoBadge />}
        actions={
          <Link href="/admin/settings">
            <Button variant="outline" size="sm">
              System settings
            </Button>
          </Link>
        }
      />

      {/* KPI Metric Strip */}
      <MetricStrip items={metricItems} />

      {/* Grid: 30D Trend Chart & System Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ChartFrame
            title="30-day city intake & resolution volume"
            description="Daily incoming citizen complaints vs municipal department resolutions"
            table={{
              columns: ["Period", "Incoming", "Resolved"],
              rows: [
                ["W1", 48, 36],
                ["W2", 62, 54],
                ["W3", 55, 58],
                ["W4", 75, 68],
              ],
            }}
          >
            <div className="flex h-64 w-full flex-col justify-end space-y-4 pt-6">
              <div className="flex h-44 items-end gap-2 sm:gap-4">
                {[
                  { day: "W1", incoming: 48, resolved: 36 },
                  { day: "W2", incoming: 62, resolved: 54 },
                  { day: "W3", incoming: 55, resolved: 58 },
                  { day: "W4", incoming: 75, resolved: 68 },
                ].map((col) => (
                  <div key={col.day} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-full w-full items-end justify-center gap-1.5">
                      <div
                        className="w-full max-w-[24px] rounded-t bg-primary/40 transition-all"
                        style={{ height: `${(col.incoming / 80) * 100}%` }}
                        title={`Incoming: ${col.incoming}`}
                      />
                      <div
                        className="w-full max-w-[24px] rounded-t bg-primary transition-all"
                        style={{ height: `${(col.resolved / 80) * 100}%` }}
                        title={`Resolved: ${col.resolved}`}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{col.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 border-t border-border pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-primary/40" />
                  <span>Incoming complaints</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-primary" />
                  <span>Resolved complaints</span>
                </div>
              </div>
            </div>
          </ChartFrame>
        </div>

        {/* System Health */}
        <div className="lg:col-span-4">
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-semibold text-foreground">System health</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Normal
              </span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Firestore operations</span>
                <span className="font-mono text-xs font-semibold text-foreground">
                  3,420 r / 480 w
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Gemini model</span>
                <span className="font-mono text-xs font-medium text-foreground">
                  gemini-2.5-flash
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">AI P95 latency</span>
                <span className="font-mono text-xs font-medium text-foreground">
                  {aiMetrics.latencyP95Ms} ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Synthetic corpus</span>
                <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                  {complaints.length} records
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">AI safety switch</span>
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                    aiMetrics.paused
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {aiMetrics.paused ? "Paused" : "Active"}
                </span>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <Link href="/admin/ai-monitoring" className="text-xs font-medium text-primary hover:underline">
                View AI telemetry & logs &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Department Leaderboard & Recent Audit Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Department Leaderboard */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Department workloads</h2>
                <p className="text-xs text-muted-foreground">
                  Current complaint queues and SLA adherence across departments
                </p>
              </div>
              <Link href="/admin/departments">
                <Button variant="ghost" size="sm" className="text-xs">
                  Manage
                </Button>
              </Link>
            </div>

            <div className="overflow-x-auto focus:outline-none focus:ring-1 focus:ring-primary rounded-md" tabIndex={0} role="region" aria-label="Department workloads table">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-medium text-muted-foreground">
                    <th className="pb-2">Department</th>
                    <th className="pb-2 text-right">Open</th>
                    <th className="pb-2 text-right">Overdue</th>
                    <th className="pb-2 text-right">SLA Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {departments.slice(0, 6).map((dept) => (
                    <tr key={dept.id} className="hover:bg-muted/50">
                      <td className="py-2.5 font-medium text-foreground">
                        <div>{dept.name}</div>
                        <div className="text-xs text-muted-foreground">{dept.code}</div>
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs">{dept.openComplaints}</td>
                      <td className="py-2.5 text-right font-mono text-xs text-critical">
                        {dept.overdueComplaints}
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs font-medium">
                        {dept.slaComplianceRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Audit Events */}
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Recent audit events</h2>
                <p className="text-xs text-muted-foreground">Latest governance actions</p>
              </div>
              <Link href="/admin/audit-logs">
                <Button variant="ghost" size="sm" className="text-xs">
                  View all
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-border bg-surface p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{log.action}</span>
                    <span className="text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{log.summary}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground/80">
                    <span>By: {log.actorEmail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
