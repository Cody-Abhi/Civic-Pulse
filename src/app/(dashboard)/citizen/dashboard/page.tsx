import Link from "next/link";
import { Plus, ArrowRight, CheckCircle2, MapPin, Bell, MessageSquare, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MetricStrip } from "@/components/data/metric-strip";
import { ReferenceChip } from "@/components/ui/reference-chip";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { DemoBadge } from "@/components/ui/demo-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/server/auth/session";
import { listComplaints } from "@/server/services/complaints";

export const metadata = {
  title: "Citizen Dashboard",
  description: "Track your reported civic issues, review municipal resolutions, and follow nearby community activity.",
};

function getGreeting(): string {
  // IST is UTC+5:30
  const now = new Date();
  const utcHours = now.getUTCHours();
  const istHours = (utcHours + 5 + (now.getUTCMinutes() + 30 >= 60 ? 1 : 0)) % 24;

  if (istHours >= 4 && istHours < 12) return "Good morning";
  if (istHours >= 12 && istHours < 17) return "Good afternoon";
  return "Good evening";
}

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export default async function CitizenDashboardPage() {
  const user = await getSessionUser();
  const greeting = getGreeting();
  const userName = user?.displayName || "Citizen";

  // Query own complaints and public complaints
  const allUserComplaints = await listComplaints({
    userId: user?.uid || "demo-citizen-uid",
    limit: 50,
  });

  const publicComplaints = await listComplaints({
    isPublicOnly: true,
    limit: 10,
  });

  // Calculate metrics
  const openStatuses = new Set(["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "REOPENED"]);
  const myOpenReports = allUserComplaints.filter((c) => openStatuses.has(c.status)).length;
  const resolvedReports = allUserComplaints.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length;
  const awaitingFeedback = allUserComplaints.filter((c) => c.status === "RESOLVED" && !c.feedback);
  const totalSupporters = allUserComplaints.reduce((acc, c) => acc + (c.supporterCount || 0), 0);

  const recentReports = allUserComplaints.slice(0, 5);
  const nearYouReports = publicComplaints.filter((c) => c.reporterUid !== (user?.uid || "demo-citizen-uid")).slice(0, 4);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <PageHeader
        title={`${greeting}, ${userName}`}
        description="Monitor status changes, confirm resolved municipal work, and discover issues reported near your ward."
        meta={<DemoBadge />}
        actions={
          <Button asChild className="gap-2">
            <Link href="/citizen/complaints/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Report an issue</span>
            </Link>
          </Button>
        }
      />

      {/* Metric Strip (§17.1) */}
      <MetricStrip
        items={[
          {
            label: "My open reports",
            value: myOpenReports,
            hint: "Active reports currently being investigated or repaired",
          },
          {
            label: "Resolved",
            value: resolvedReports,
            hint: "Municipal work completed or verified",
          },
          {
            label: "Awaiting my feedback",
            value: awaitingFeedback.length,
            hint: "Reports marked resolved by authority waiting for your confirmation",
            delta: awaitingFeedback.length > 0 ? { value: "Action needed", isPositive: false } : undefined,
          },
          {
            label: "Neighbors supporting",
            value: totalSupporters,
            hint: "Fellow citizens who added their voice to your reports",
          },
        ]}
      />

      {/* Main 8 / 4 Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column (8 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Needs Your Input Alert Box */}
          {awaitingFeedback.length > 0 && (
            <div className="flex flex-col gap-3 rounded-md border border-warning/40 bg-warning-bg/40 p-5">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
                <h2 className="font-semibold text-ink text-base">Needs your verification</h2>
              </div>
              <p className="text-sm text-ink-muted">
                The municipal team marked {awaitingFeedback.length === 1 ? "this report" : "these reports"} as resolved. Please verify on ground and confirm or reopen.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                {awaitingFeedback.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <ReferenceChip reference={item.ref} />
                        <span className="font-medium text-ink text-sm truncate max-w-[280px]">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-xs text-muted">
                        Resolved {formatRelativeTime(item.statusChangedAt)} · {item.location.landmark || "Bengaluru"}
                      </span>
                    </div>
                    <Button asChild size="sm" variant="secondary" className="shrink-0 gap-1.5 self-start sm:self-auto">
                      <Link href={`/citizen/complaints/${item.id}`}>
                        <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                        <span>Confirm fix</span>
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Your Recent Reports Panel */}
          <section
            aria-labelledby="recent-reports-heading"
            className="flex flex-col rounded-md border border-border bg-surface shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2.5">
                <h2 id="recent-reports-heading" className="text-base font-semibold text-ink">
                  Your recent reports
                </h2>
                <span className="rounded-full bg-surface-muted px-2 py-0.5 font-mono text-xs text-muted">
                  {allUserComplaints.length}
                </span>
              </div>
              <Link
                href="/citizen/complaints"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span>View all reports</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            {recentReports.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No reports filed yet"
                  body="Spotted a road pothole, overflowing garbage, or dark street? File a report in less than 2 minutes."
                  action={
                    <Button asChild size="sm">
                      <Link href="/citizen/complaints/new">Report an issue</Link>
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentReports.map((complaint) => (
                  <Link
                    key={complaint.id}
                    href={`/citizen/complaints/${complaint.id}`}
                    className="group flex flex-col gap-3 p-5 transition-colors hover:bg-surface-muted/50 focus-visible:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ReferenceChip reference={complaint.ref} />
                        <span className="text-xs text-muted">
                          {complaint.category.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={complaint.status} />
                        <PriorityBadge band={complaint.priority.band} score={complaint.priority.score} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-medium text-ink group-hover:text-primary transition-colors">
                        {complaint.title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-ink-muted">
                        {complaint.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                        <span className="truncate max-w-[200px] sm:max-w-none">
                          {complaint.location.landmark || complaint.location.wardName || "Bengaluru"}
                        </span>
                      </span>
                      <span>Updated {formatRelativeTime(complaint.statusChangedAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (4 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Near You Panel */}
          <section
            aria-labelledby="near-you-heading"
            className="flex flex-col rounded-md border border-border bg-surface shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 id="near-you-heading" className="text-base font-semibold text-ink">
                Near you
              </h2>
              <Link
                href="/explore/map"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>Live map</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="divide-y divide-border">
              {nearYouReports.map((c) => (
                <div key={c.id} className="flex flex-col gap-1.5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-muted">
                      {c.ref}
                    </span>
                    <PriorityBadge band={c.priority.band} score={c.priority.score} />
                  </div>
                  <h3 className="text-sm font-medium text-ink line-clamp-1">
                    {c.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{c.location.landmark || "Bengaluru"}</span>
                    <span>{c.supporterCount > 0 ? `${c.supporterCount} supporters` : "1 reporter"}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Notifications Preview */}
          <section
            aria-labelledby="notifications-heading"
            className="flex flex-col rounded-md border border-border bg-surface shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 id="notifications-heading" className="text-base font-semibold text-ink">
                  Alerts & updates
                </h2>
              </div>
              <Link
                href="/citizen/notifications"
                className="text-xs font-semibold text-primary hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="flex flex-col divide-y divide-border p-2">
              <div className="flex items-start gap-3 p-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success mt-0.5" aria-hidden="true" />
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs font-medium text-ink">Road pothole resolution verified</p>
                  <span className="text-[11px] text-muted">2 hours ago · Roads Dept</span>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3">
                <MessageSquare className="h-4 w-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs font-medium text-ink">3 neighbors added their voice to CP-BLR-2611-000042</p>
                  <span className="text-[11px] text-muted">Yesterday · Bellandur</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
