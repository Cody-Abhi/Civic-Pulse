"use client";

import * as React from "react";
import { ChartFrame } from "@/components/data/chart-frame";
import { MetricStrip, type MetricStripItem } from "@/components/data/metric-strip";
import type { Complaint, Department, WardSummary } from "@/domain/types";

interface AdminAnalyticsClientProps {
  complaints: Complaint[];
  departments: Department[];
  wardStats: WardSummary[];
}

export function AdminAnalyticsClient({
  complaints,
  departments,
  wardStats,
}: AdminAnalyticsClientProps) {
  const [selectedDeptId, setSelectedDeptId] = React.useState<string>("all");

  const scopedComplaints = React.useMemo(() => {
    if (selectedDeptId === "all") return complaints;
    return complaints.filter((c) => c.departmentId === selectedDeptId);
  }, [complaints, selectedDeptId]);

  const total = scopedComplaints.length;
  const resolved = scopedComplaints.filter((c) => c.status === "RESOLVED").length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const overdue = scopedComplaints.filter(
    (c) => c.status !== "RESOLVED" && c.status !== "REJECTED" && (c.priority.score >= 70 || c.reopenCount > 0),
  ).length;

  const metricItems: MetricStripItem[] = [
    {
      label: "Total complaints logged",
      value: total,
      hint: selectedDeptId === "all" ? "All municipal departments" : "Filtered department",
    },
    {
      label: "Resolution rate",
      value: `${resolutionRate}%`,
      delta: { value: "+4.2%", label: "vs last month", isPositive: true },
    },
    {
      label: "Median time to resolve",
      value: "44.6 hrs",
      hint: "SLA target < 72 hrs",
    },
    {
      label: "SLA breached",
      value: overdue,
      delta: { value: "-8", label: "this week", isPositive: true },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Scope Selector */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-sm font-semibold text-foreground">Analytics scope:</span>
          <p className="text-xs text-muted-foreground">
            Compare performance across municipal directorates or isolate single departments.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <select
            id="analytics-dept-select"
            aria-label="Select department analytics scope"
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Entire city (All departments)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Strip */}
      <MetricStrip items={metricItems} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Department SLA Comparison */}
        <div className="lg:col-span-6">
          <ChartFrame
            title="Department SLA compliance"
            description="Percentage of complaints resolved within designated SLA timeframe"
            table={{
              columns: ["Department", "Compliance"],
              rows: departments.map((d) => [d.name, `${d.slaComplianceRate}%`]),
            }}
          >
            <div className="space-y-4 pt-4">
              {departments.map((dept) => (
                <div key={dept.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">{dept.name}</span>
                    <span className="font-mono text-muted-foreground">{dept.slaComplianceRate}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${dept.slaComplianceRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartFrame>
        </div>

        {/* Top Wards by Activity */}
        <div className="lg:col-span-6">
          <ChartFrame
            title="Ward grievance distribution"
            description="High-density wards with active resolution workloads"
            table={{
              columns: ["Ward", "Total", "Open"],
              rows: wardStats.slice(0, 6).map((w) => [w.wardName, w.totalComplaints, w.openComplaints]),
            }}
          >
            <div className="space-y-4 pt-4">
              {wardStats.slice(0, 6).map((ward) => (
                <div key={ward.wardId} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">{ward.wardName}</span>
                    <span className="font-mono text-muted-foreground">
                      {ward.totalComplaints} reports ({ward.openComplaints} open)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-teal-600"
                      style={{ width: `${Math.min(100, (ward.totalComplaints / 60) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartFrame>
        </div>
      </div>

      {/* Department Comparison Full Table */}
      <div className="rounded-xl border border-border bg-surface-card p-5 shadow-xs">
        <h2 className="mb-3 text-base font-semibold text-foreground">
          Departmental operational benchmark
        </h2>
        <div className="overflow-x-auto focus:outline-none focus:ring-1 focus:ring-primary rounded-md" tabIndex={0} role="region" aria-label="Department operational benchmark table">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-medium text-muted-foreground">
                <th className="pb-3">Department</th>
                <th className="pb-3">Code</th>
                <th className="pb-3 text-right">Engineers</th>
                <th className="pb-3 text-right">Total Assigned</th>
                <th className="pb-3 text-right">Open</th>
                <th className="pb-3 text-right">Overdue</th>
                <th className="pb-3 text-right">SLA Adherence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {departments.map((dept) => {
                const totalDept = complaints.filter((c) => c.departmentId === dept.id).length;
                return (
                  <tr key={dept.id} className="hover:bg-muted/40">
                    <td className="py-3 font-medium text-foreground">{dept.name}</td>
                    <td className="py-3 font-mono text-xs">{dept.code}</td>
                    <td className="py-3 text-right font-mono text-xs">{dept.authoritiesCount}</td>
                    <td className="py-3 text-right font-mono text-xs">{totalDept}</td>
                    <td className="py-3 text-right font-mono text-xs">{dept.openComplaints}</td>
                    <td className="py-3 text-right font-mono text-xs text-critical">
                      {dept.overdueComplaints}
                    </td>
                    <td className="py-3 text-right font-mono text-xs font-semibold">
                      {dept.slaComplianceRate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
