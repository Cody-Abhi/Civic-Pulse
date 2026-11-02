import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/layout/page-header";
import { MetricStrip } from "@/components/data/metric-strip";
import { DemoBadge } from "@/components/ui/demo-badge";
import { ChartFrame } from "@/components/data/chart-frame";
import { AIInsightsPanel } from "@/components/ai/ai-insights-panel";
import { listComplaints } from "@/server/services/complaints";

export const metadata: Metadata = {
  title: "Department Analytics",
  description: "KPIs, SLA compliance rates, and resolution turnaround times across Bengaluru wards.",
};

export default async function AuthorityAnalyticsPage() {
  const allComplaints = await listComplaints({ limit: 240 });

  const total = allComplaints.length;
  const resolvedCount = allComplaints.filter(
    (c) => c.status === "RESOLVED" || c.status === "CLOSED",
  ).length;
  const resolvedRate = Math.round((resolvedCount / (total || 1)) * 100);

  // Group by category
  const categoryCounts: Record<string, number> = {};
  allComplaints.forEach((c) => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  const categoryEntries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  // Group by ward
  const wardCounts: Record<string, { total: number; resolved: number }> = {};
  allComplaints.forEach((c) => {
    const w = c.location.wardName || "Other Wards";
    if (!wardCounts[w]) wardCounts[w] = { total: 0, resolved: 0 };
    wardCounts[w].total += 1;
    if (c.status === "RESOLVED" || c.status === "CLOSED") {
      wardCounts[w].resolved += 1;
    }
  });

  const wardEntries = Object.entries(wardCounts)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1360px] mx-auto w-full">
      {/* ── Page Header ── */}
      <PageHeader
        title="Engineering KPI &amp; SLA Compliance"
        description="30-day operational performance, resolution rates, and ward turnaround efficiency."
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-semibold text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Department 30D KPI
            </span>
            <DemoBadge />
          </>
        }
        actions={
          <Link href="/authority/queue">
            <Button size="sm" className="h-9 gap-1.5 font-semibold shadow-xs">
              <span>View Active Queue</span>
              <Icon icon={ArrowRight} size={14} />
            </Button>
          </Link>
        }
      />

      {/* ── Metric Strip ── */}
      <MetricStrip
        items={[
          {
            label: "SLA compliance rate",
            value: "92.4%",
            hint: "Tickets resolved within target hours",
          },
          {
            label: "Median resolution time",
            value: "19.5h",
            hint: "Across all priority tiers",
          },
          {
            label: "Resolution rate",
            value: `${resolvedRate}%`,
            hint: `${resolvedCount} of ${total} tickets completed`,
          },
          {
            label: "Citizen satisfaction",
            value: "4.6/5",
            hint: "From verified closure feedback",
          },
        ]}
      />

      {/* ── AI Civic Insights (§31.4) ── */}
      <AIInsightsPanel scope="dept:roads" />

      {/* ── Visual Analytics Grids ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Breakdown ChartFrame */}
        <ChartFrame
          title="Workload by Civic Category"
          description="Distribution of incoming grievances assigned to municipal engineering teams."
          table={{
            columns: ["Category", "Total Reports", "Share of Volume"],
            rows: categoryEntries.map(([cat, count]) => [
              cat,
              count,
              `${Math.round((count / total) * 100)}%`,
            ]),
          }}
        >
          <div className="flex flex-col gap-3 py-2">
            {categoryEntries.slice(0, 6).map(([cat, count]) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={cat} className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{cat}</span>
                    <span className="font-bold text-muted">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-subtle overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all rounded-full"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartFrame>

        {/* Ward Performance ChartFrame */}
        <ChartFrame
          title="Top Ward Workload &amp; Resolution"
          description="Ticket volume and completed disposals in key pilot wards."
          table={{
            columns: ["Ward Name", "Total Tickets", "Resolved", "Compliance"],
            rows: wardEntries.map(([wardName, data]) => [
              wardName,
              data.total,
              data.resolved,
              `${Math.round((data.resolved / data.total) * 100)}%`,
            ]),
          }}
        >
          <div className="flex flex-col gap-3 py-2">
            {wardEntries.map(([wardName, data]) => {
              const compRate = Math.round((data.resolved / data.total) * 100);
              return (
                <div key={wardName} className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{wardName}</span>
                    <span className="font-bold text-ink">
                      {data.resolved}/{data.total} resolved ({compRate}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-subtle overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all rounded-full"
                      style={{ width: `${Math.max(5, compRate)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartFrame>
      </div>

      {/* ── Operational Insight Card ── */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 shrink-0">
            <Icon icon={ShieldCheck} size={20} />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-bold text-ink">
              Transparent Priority Receipts Lower Pendency
            </h3>
            <p className="text-xs text-muted leading-relaxed max-w-[65ch]">
              Clear explanation of factor weights reduces repeat duplicate reports by 41% and keeps citizen satisfaction scores above 90% across pilot wards.
            </p>
          </div>
        </div>

        <Link href="/authority/map">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-semibold shrink-0">
            <span>Explore Ward Hotspots</span>
            <Icon icon={ArrowRight} size={13} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
