"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  Clock,
  RotateCcw,
  ExternalLink,
  Download,
  LayoutGrid,
  ListFilter,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { ReferenceChip } from "@/components/ui/reference-chip";
import { DemoBadge } from "@/components/ui/demo-badge";
import { LiveIndicator } from "@/components/ui/live-indicator";
import { DataTable } from "@/components/data/data-table";
import type { ColumnDef } from "@/components/data/data-table.types";
import type { Complaint, ComplaintStatus } from "@/domain/types";
import { getDepartmentName } from "@/domain/departments";
import { useRealtimeQueue } from "@/hooks/use-realtime-queue";

interface QueueViewProps {
  initialComplaints: Complaint[];
  currentUserDepartmentId?: string | null;
  currentUserRole?: "citizen" | "authority" | "admin";
}

const CATEGORIES = [
  { key: "ALL", label: "All categories" },
  { key: "POTHOLE", label: "Potholes & Road Damage" },
  { key: "INFRASTRUCTURE", label: "Footpaths & Infrastructure" },
  { key: "DRAINAGE", label: "Drainage & Stormwater" },
  { key: "GARBAGE", label: "Garbage & Waste" },
  { key: "STREETLIGHT", label: "Streetlights & Electrical" },
  { key: "WATER_LEAK", label: "Water Supply & Leaks" },
  { key: "SANITATION", label: "Sanitation & Public Health" },
  { key: "OTHER", label: "Other Civic Issues" },
];

const WARDS = [
  "All Wards",
  "Bellandur",
  "Koramangala",
  "Indiranagar",
  "HSR Layout",
  "Whitefield",
  "Jayanagar",
  "Malleshwaram",
];

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "ALL_ACTIVE", label: "All active" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "UNDER_REVIEW", label: "Under review" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "CLOSED", label: "Closed" },
];

export function QueueView({
  initialComplaints,
  currentUserDepartmentId,
  currentUserRole,
}: QueueViewProps) {
  const router = useRouter();
  const { complaints, isLive } = useRealtimeQueue(
    initialComplaints,
    currentUserDepartmentId || (currentUserRole === "admin" ? null : "roads"),
  );
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("ALL");
  const [ward, setWard] = React.useState("All Wards");
  const [statusTab, setStatusTab] = React.useState("ALL_ACTIVE");
  const [viewMode, setViewMode] = React.useState<"table" | "kanban">("table");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = React.useState<ComplaintStatus>("IN_PROGRESS");
  const [bulkLoading, setBulkLoading] = React.useState(false);
  const [bulkFeedback, setBulkFeedback] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState<{ field: string; direction: "asc" | "desc" }>({
    field: "score",
    direction: "desc",
  });

  // Filter complaints
  const filteredRows = React.useMemo(() => {
    let list = [...complaints];

    // Status tab filter
    if (statusTab === "ALL_ACTIVE") {
      list = list.filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED");
    } else {
      list = list.filter((c) => c.status === statusTab);
    }

    // Category filter
    if (category !== "ALL") {
      list = list.filter((c) => c.category === category);
    }

    // Ward filter
    if (ward !== "All Wards") {
      list = list.filter(
        (c) => c.location.wardName?.toLowerCase() === ward.toLowerCase(),
      );
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.ref.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.location.landmark && c.location.landmark.toLowerCase().includes(q)) ||
          (c.location.wardName && c.location.wardName.toLowerCase().includes(q)),
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sort.field === "score") {
        return sort.direction === "asc"
          ? a.priority.score - b.priority.score
          : b.priority.score - a.priority.score;
      }
      if (sort.field === "created") {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sort.direction === "asc" ? timeA - timeB : timeB - timeA;
      }
      return 0;
    });

    return list;
  }, [complaints, statusTab, category, ward, search, sort]);

  const handleReset = () => {
    setSearch("");
    setCategory("ALL");
    setWard("All Wards");
    setStatusTab("ALL_ACTIVE");
    setSort({ field: "score", direction: "desc" });
    setSelectedIds([]);
  };

  const handleBulkTransition = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/complaints/bulk-transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          to: bulkStatus,
          note: `Bulk transitioned to ${bulkStatus} by municipal supervisor`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || "Bulk transition failed.");
      }
      const data = await res.json();
      const updatedCount = data.updated ?? selectedIds.length;
      setBulkFeedback(`Successfully updated ${updatedCount} complaints.`);
      setSelectedIds([]);
      setTimeout(() => {
        setBulkFeedback(null);
        router.refresh();
      }, 2000);
    } catch (err) {
      setBulkFeedback(err instanceof Error ? err.message : "Error updating complaints.");
    } finally {
      setBulkLoading(false);
    }
  };

  // Columns definition for DataTable
  const columns: ColumnDef<Complaint>[] = [
    {
      id: "ref",
      header: "Reference",
      widthPx: 200,
      cell: (row) => <ReferenceChip reference={row.ref} />,
    },
    {
      id: "title",
      header: "Issue & Category",
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <Link
            href={`/authority/complaints/${row.id}`}
            className="text-xs font-bold text-ink hover:text-primary transition-colors line-clamp-1"
          >
            {row.title}
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="font-semibold text-ink-secondary">{row.category}</span>
            {row.location.landmark && (
              <>
                <span>•</span>
                <span className="truncate max-w-[160px]">{row.location.landmark}</span>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "ward",
      header: "Ward",
      widthPx: 130,
      hideBelow: "md",
      cell: (row) => (
        <span className="text-xs text-ink-secondary font-medium">
          {row.location.wardName || "Bengaluru"}
        </span>
      ),
    },
    {
      id: "score",
      header: "Priority Score",
      widthPx: 130,
      sortable: true,
      sortField: "score",
      cell: (row) => (
        <PriorityBadge band={row.priority.band} score={row.priority.score} size="sm" />
      ),
    },
    {
      id: "sla",
      header: "Target SLA",
      widthPx: 120,
      hideBelow: "lg",
      cell: (row) => {
        const isCritical = row.priority.band === "CRITICAL";
        return (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              isCritical ? "text-danger" : "text-muted"
            }`}
          >
            <Icon icon={Clock} size={12} />
            <span>{isCritical ? "< 24h" : `${row.slaHours || 48}h`}</span>
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      widthPx: 110,
      cell: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      id: "action",
      header: "",
      widthPx: 90,
      cell: (row) => (
        <Link href={`/authority/complaints/${row.id}`}>
          <Button size="sm" variant="outline" className="h-7 text-xs font-semibold px-2">
            <span>Triage</span>
          </Button>
        </Link>
      ),
    },
  ];

  // Mobile card view for viewports < 768px (QueueCardList wraps each card in role="button")
  const renderMobileRow = (row: Complaint) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <ReferenceChip reference={row.ref} copyable={false} />
        <div className="flex items-center gap-1.5">
          <PriorityBadge band={row.priority.band} score={row.priority.score} size="sm" />
          <StatusBadge status={row.status} size="sm" />
        </div>
      </div>
      <h3 className="line-clamp-2 text-xs font-bold text-ink">{row.title}</h3>
      <div className="flex items-center justify-between text-xs text-muted pt-1 border-t border-border/60">
        <span>{row.location.wardName || "Bengaluru"}</span>
        <span className="flex items-center gap-1 text-primary font-semibold">
          <span>Open Workspace</span>
          <Icon icon={ArrowRight} size={12} />
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1360px] mx-auto w-full">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Priority Operational Queue
            </h1>
            <DemoBadge />
            <LiveIndicator isLive={isLive} />
            {currentUserDepartmentId && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-ink">
                <Icon icon={Building2} size={12} className="text-primary" />
                <span>{getDepartmentName(currentUserDepartmentId)}</span>
              </span>
            )}
            {currentUserRole === "admin" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-300 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
                <span>All Departments (Admin Mode)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-ink-secondary sm:text-sm">
            Ranked deterministically by 7-factor civic priority engine. Higher score tickets appear first.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Table vs Kanban (§UI-08..14) */}
          <div className="flex items-center rounded-lg border border-border bg-surface p-0.5 text-xs">
            <button
              type="button"
              aria-label="Switch to queue table view"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-semibold transition-colors ${
                viewMode === "table"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Icon icon={ListFilter} size={14} />
              <span>Queue</span>
            </button>
            <button
              type="button"
              aria-label="Switch to kanban status board"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-semibold transition-colors ${
                viewMode === "kanban"
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Icon icon={LayoutGrid} size={14} />
              <span>Kanban</span>
            </button>
          </div>

          <a href="/api/exports/complaints.csv" download="complaints.csv">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 font-semibold">
              <Icon icon={Download} size={14} />
              <span>Export CSV</span>
            </Button>
          </a>

          <Link href="/authority/map">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 font-semibold">
              <Icon icon={ExternalLink} size={14} />
              <span>Map View</span>
            </Button>
          </Link>
        </div>
      </div>

      {bulkFeedback && (
        <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-xs font-semibold text-primary flex items-center gap-2">
          <Icon icon={CheckCircle2} size={16} />
          <span>{bulkFeedback}</span>
        </div>
      )}

      {/* ── Status Filter Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border pb-2">
        {STATUS_TABS.map((tab) => {
          const isActive = statusTab === tab.key;
          const count =
            tab.key === "ALL_ACTIVE"
              ? complaints.filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED").length
              : complaints.filter((c) => c.status === tab.key).length;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusTab(tab.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface text-muted hover:bg-surface-subtle hover:text-ink border border-border"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive ? "bg-white text-primary" : "bg-border text-ink"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-xs sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
            <Icon icon={Search} size={15} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search queue by reference, keyword or landmark..."
            className="h-9 w-full rounded-md border border-border bg-canvas pl-9 pr-3 text-xs text-ink placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>

        {/* Category Select */}
        <div className="flex items-center gap-2">
          <select
            value={category}
            aria-label="Filter by category"
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-md border border-border bg-canvas px-2.5 text-xs font-medium text-ink focus:border-primary focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Ward Select */}
          <select
            value={ward}
            aria-label="Filter by ward"
            onChange={(e) => setWard(e.target.value)}
            className="h-9 rounded-md border border-border bg-canvas px-2.5 text-xs font-medium text-ink focus:border-primary focus:outline-none"
          >
            {WARDS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          {(search || category !== "ALL" || ward !== "All Wards") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-9 gap-1 text-xs text-muted hover:text-ink px-2"
            >
              <Icon icon={RotateCcw} size={12} />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── View: Table vs Kanban ── */}
      {viewMode === "table" ? (
        <DataTable<Complaint>
          columns={columns}
          rows={filteredRows}
          status="ready"
          sort={sort}
          onSortChange={setSort}
          selectable={true}
          selectedIds={new Set(selectedIds)}
          onSelectionChange={(set) => setSelectedIds(Array.from(set))}
          onRowOpen={(row) => router.push(`/authority/complaints/${row.id}`)}
          mobileRow={renderMobileRow}
          caption="Operational Priority Queue"
          empty={{
            title: "No issues in this queue view",
            body: "No complaints match your active filter criteria.",
            action: (
              <Button variant="outline" size="sm" onClick={handleReset}>
                Reset filters
              </Button>
            ),
          }}
        />
      ) : (
        /* ── Kanban View (§UI-09) ── */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED"] as const).map((colStatus) => {
            const colComplaints = filteredRows.filter((c) => c.status === colStatus);
            const colTitles: Record<string, string> = {
              SUBMITTED: "Submitted (New)",
              UNDER_REVIEW: "Under Review",
              IN_PROGRESS: "In Progress (Field)",
              RESOLVED: "Resolved",
            };

            return (
              <div key={colStatus} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink">
                    {colTitles[colStatus]}
                  </span>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-mono font-bold text-muted">
                    {colComplaints.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-1">
                  {colComplaints.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted">
                      No complaints in this lane
                    </div>
                  ) : (
                    colComplaints.map((c) => (
                      <Link
                        key={c.id}
                        href={`/authority/complaints/${c.id}`}
                        className="flex flex-col gap-2 rounded-lg border border-border bg-canvas p-3.5 hover:border-primary transition-all shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <ReferenceChip reference={c.ref} copyable={false} />
                          <PriorityBadge band={c.priority.band} score={c.priority.score} size="sm" />
                        </div>
                        <h4 className="line-clamp-2 text-xs font-bold text-ink">
                          {c.title}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-border/60">
                          <span>{c.location.wardName || "Bengaluru"}</span>
                          <span className="font-semibold text-primary">Triage →</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Sticky Bulk Actions Bar (§UI-08) ── */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-surface p-4 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {selectedIds.length}
            </span>
            <span className="text-sm font-semibold text-ink">complaints selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bulkStatus}
              aria-label="Target status for bulk transition"
              onChange={(e) => setBulkStatus(e.target.value as ComplaintStatus)}
              className="h-9 rounded-md border border-border bg-canvas px-3 text-xs font-semibold text-ink focus:border-primary focus:outline-none"
            >
              <option value="UNDER_REVIEW">Transition to Under Review</option>
              <option value="IN_PROGRESS">Transition to In Progress</option>
              <option value="RESOLVED">Transition to Resolved</option>
              <option value="CLOSED">Transition to Closed</option>
            </select>

            <Button
              size="sm"
              onClick={handleBulkTransition}
              disabled={bulkLoading}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              {bulkLoading ? "Updating..." : "Apply Bulk Status"}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="h-9 text-xs text-muted hover:text-ink"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
