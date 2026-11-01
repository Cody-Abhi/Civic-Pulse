import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  MapPin,
  FileText,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/layout/page-header";
import { MetricStrip } from "@/components/data/metric-strip";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { ReferenceChip } from "@/components/ui/reference-chip";
import { DemoBadge } from "@/components/ui/demo-badge";
import { listComplaints } from "@/server/services/complaints";

export const metadata: Metadata = {
  title: "Authority Operations Dashboard · CivicPulse AI",
  description: "Operational dispatch dashboard for municipal engineers and ward supervisors.",
};

export default async function AuthorityDashboardPage() {
  const allComplaints = await listComplaints({ limit: 120 });

  // Operational metrics
  const activeQueue = allComplaints.filter(
    (c) => c.status !== "RESOLVED" && c.status !== "CLOSED",
  );
  const criticalComplaints = activeQueue.filter((c) => c.priority.band === "CRITICAL");
  const overdueComplaints = activeQueue.filter((c) => c.priority.score >= 70 || c.reopenCount > 0);
  const resolvedCount = allComplaints.filter(
    (c) => c.status === "RESOLVED" || c.status === "CLOSED",
  ).length;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1360px] mx-auto w-full">
      {/* ── Page Header ── */}
      <PageHeader
        title="Engineering Operations Command"
        description="Assigned municipal queue for Bengaluru East & South wards. Triage, dispatch, and track SLA compliance."
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-semibold text-muted">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              Live Operations
            </span>
            <DemoBadge />
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/authority/map">
              <Button variant="outline" size="sm" className="h-9 gap-1.5 font-semibold">
                <Icon icon={MapPin} size={14} />
                <span>Ops Map</span>
              </Button>
            </Link>
            <Link href="/authority/queue">
              <Button size="sm" className="h-9 gap-1.5 font-semibold shadow-xs">
                <Icon icon={FileText} size={14} />
                <span>Priority Queue</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── Metric Strip ── */}
      <MetricStrip
        items={[
          {
            label: "Active department queue",
            value: activeQueue.length,
            hint: "Pending triage or investigation",
          },
          {
            label: "Critical priority issues",
            value: criticalComplaints.length,
            hint: "Score ≥ 70 · Immediate dispatch",
          },
          {
            label: "SLA overdue or breached",
            value: overdueComplaints.length,
            hint: "Target turnaround exceeded",
          },
          {
            label: "Resolved & closed",
            value: resolvedCount,
            hint: "Verified solutions completed",
          },
        ]}
      />

      {/* ── 8/4 Grid: Immediate Attention & Queue Overview ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column (8 cols): Immediate Attention list */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Icon icon={AlertTriangle} size={18} className="text-danger" />
                <h2 className="text-base font-bold text-ink">Urgent Attention Queue</h2>
              </div>
              <Link href="/authority/queue" className="text-xs font-semibold text-primary hover:underline">
                View all ({criticalComplaints.length})
              </Link>
            </div>

            <div className="flex flex-col divide-y divide-border/60">
              {criticalComplaints.slice(0, 6).map((c) => (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ReferenceChip reference={c.ref} />
                      <PriorityBadge band={c.priority.band} score={c.priority.score} size="sm" />
                      <StatusBadge status={c.status} size="sm" />
                    </div>
                    <Link
                      href={`/authority/complaints/${c.id}`}
                      className="text-sm font-bold text-ink hover:text-primary transition-colors truncate"
                    >
                      {c.title}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span>{c.location.wardName || "Bengaluru Ward"}</span>
                      <span>•</span>
                      <span>{c.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-danger font-semibold">
                        <Icon icon={Clock} size={12} />
                        <span>SLA: &lt; 24h</span>
                      </span>
                    </div>
                  </div>

                  <Link href={`/authority/complaints/${c.id}`} className="shrink-0">
                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs font-semibold">
                      <span>Workspace</span>
                      <Icon icon={ArrowRight} size={12} />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Quick SLA Compliance Banner */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                <Icon icon={Sparkles} size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Autonomous Priority Ledger Active</h3>
                <p className="text-xs text-ink-secondary mt-0.5 leading-relaxed max-w-[50ch]">
                  Every queue ticket is ranked objectively by the 7-factor engine. Priority receipts explain scores to citizens, eliminating manual complaints chasing.
                </p>
              </div>
            </div>
            <Link href="/authority/analytics">
              <Button size="sm" className="h-9 gap-1.5 text-xs font-semibold shrink-0">
                <Icon icon={BarChart3} size={14} />
                <span>SLA Analytics</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column (4 cols): Operations Sidebar & Quick Nav */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Operations Navigation Box */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col gap-3">
            <h2 className="text-sm font-bold text-ink">Field Operations Dispatch</h2>
            <p className="text-xs text-muted leading-relaxed">
              Supervisors can adjust priority by ±15 points with mandatory rationale notes, reassign misrouted categories, and log resolution photos.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <Link href="/authority/queue">
                <Button variant="outline" className="w-full justify-between h-10 text-xs font-semibold">
                  <span className="flex items-center gap-2">
                    <Icon icon={FileText} size={14} />
                    Priority Queue Table
                  </span>
                  <Icon icon={ArrowRight} size={14} />
                </Button>
              </Link>
              <Link href="/authority/map">
                <Button variant="outline" className="w-full justify-between h-10 text-xs font-semibold">
                  <span className="flex items-center gap-2">
                    <Icon icon={MapPin} size={14} />
                    Ward Hotspots &amp; Clusters Map
                  </span>
                  <Icon icon={ArrowRight} size={14} />
                </Button>
              </Link>
              <Link href="/authority/analytics">
                <Button variant="outline" className="w-full justify-between h-10 text-xs font-semibold">
                  <span className="flex items-center gap-2">
                    <Icon icon={BarChart3} size={14} />
                    Department KPI &amp; SLA Trends
                  </span>
                  <Icon icon={ArrowRight} size={14} />
                </Button>
              </Link>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Top Category Workload
            </h3>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink font-medium">Roads &amp; Footpaths</span>
                <span className="font-bold text-ink">48 active</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-subtle overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "45%" }} />
              </div>

              <div className="flex items-center justify-between mt-1">
                <span className="text-ink font-medium">Drainage &amp; Sewage</span>
                <span className="font-bold text-ink">28 active</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-subtle overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "26%" }} />
              </div>

              <div className="flex items-center justify-between mt-1">
                <span className="text-ink font-medium">Streetlights</span>
                <span className="font-bold text-ink">22 active</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-subtle overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "20%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
