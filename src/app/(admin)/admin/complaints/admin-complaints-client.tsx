"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Copy, Flag, ExternalLink } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import type { ColumnDef } from "@/components/data/data-table.types";
import { QueueCardList } from "@/components/data/queue-card-list";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { ReferenceChip } from "@/components/ui/reference-chip";
import { Button } from "@/components/ui/button";
import type { Complaint, Department } from "@/domain/types";

interface AdminComplaintsClientProps {
  initialComplaints: Complaint[];
  departments: Department[];
}

export function AdminComplaintsClient({
  initialComplaints,
  departments,
}: AdminComplaintsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"all" | "duplicates" | "flagged">("all");
  const [complaints] = React.useState<Complaint[]>(initialComplaints);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [deptFilter, setDeptFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState<string>("");

  const filteredComplaints = React.useMemo(() => {
    return complaints.filter((c) => {
      // Tab filtering
      if (activeTab === "duplicates" && !c.clusterRootId && c.linkedChildIds.length === 0) {
        return false;
      }
      if (activeTab === "flagged" && c.priority.score < 80 && c.reopenCount === 0) {
        return false;
      }

      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (deptFilter !== "all" && c.departmentId !== deptFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matches =
          c.ref.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.reporterDisplayName.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [complaints, activeTab, statusFilter, deptFilter, search]);

  const columns: ColumnDef<Complaint>[] = [
    {
      id: "ref",
      header: "Reference",
      cell: (row) => <ReferenceChip reference={row.ref} copyable={false} />,
    },
    {
      id: "title",
      header: "Complaint",
      cell: (row) => (
        <div className="max-w-xs sm:max-w-md">
          <div className="truncate font-medium text-foreground">{row.title}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="capitalize">{row.category.toLowerCase()}</span>
            <span>&middot;</span>
            <span>{row.departmentName}</span>
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      id: "priority",
      header: "Priority",
      cell: (row) => <PriorityBadge score={row.priority.score} band={row.priority.band} />,
    },
    {
      id: "actions",
      header: "Action",
      cell: (row) => (
        <Link href={`/authority/complaints/${row.id}`}>
          <Button variant="outline" size="sm" className="h-8">
            <ExternalLink className="mr-1 h-3.5 w-3.5" />
            Inspect
          </Button>
        </Link>
      ),
    },
  ];

  const duplicateCount = complaints.filter(
    (c) => Boolean(c.clusterRootId) || c.linkedChildIds.length > 0,
  ).length;

  const flaggedCount = complaints.filter(
    (c) => c.priority.score >= 80 || c.reopenCount > 0,
  ).length;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>All complaints ({complaints.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("duplicates")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "duplicates"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Copy className="h-4 w-4" />
          <span>Duplicate clusters ({duplicateCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("flagged")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "flagged"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Flag className="h-4 w-4" />
          <span>Flagged / High safety ({flaggedCount})</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="search-complaints-admin" className="mb-1 block text-xs font-medium text-muted-foreground">
            Search
          </label>
          <input
            id="search-complaints-admin"
            type="text"
            placeholder="Search ref, title, reporter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="filter-status-admin" className="mb-1 block text-xs font-medium text-muted-foreground">
            Status
          </label>
          <select
            id="filter-status-admin"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="TRIAGED">Triaged</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-dept-admin" className="mb-1 block text-xs font-medium text-muted-foreground">
            Department
          </label>
          <select
            id="filter-dept-admin"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          rows={filteredComplaints}
          status="ready"
          caption="City-wide Complaints Register"
          empty={{ title: "No complaints found" }}
        />
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden">
        <QueueCardList
          rows={filteredComplaints}
          onCardClick={(c) => {
            router.push(`/authority/complaints/${c.id}`);
          }}
          renderCard={(c) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <ReferenceChip reference={c.ref} copyable={false} />
                <StatusBadge status={c.status} />
              </div>
              <div className="font-medium text-foreground">{c.title}</div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{c.category.toLowerCase()}</span>
                <PriorityBadge score={c.priority.score} band={c.priority.band} />
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
