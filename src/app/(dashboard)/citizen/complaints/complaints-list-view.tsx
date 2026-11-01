"use client";

import * as React from "react";
import Link from "next/link";
import { Search, MapPin, Filter, ArrowUpDown } from "lucide-react";
import { ReferenceChip } from "@/components/ui/reference-chip";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import type { Complaint } from "@/domain/types";

export interface ComplaintsListViewProps {
  complaints: Complaint[];
}

type TabKey = "ALL" | "OPEN" | "RESOLVED" | "CLOSED";

const OPEN_STATUSES = new Set(["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "REOPENED"]);

export function ComplaintsListView({ complaints }: ComplaintsListViewProps) {
  const [activeTab, setActiveTab] = React.useState<TabKey>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("ALL");
  const [sortBy, setSortBy] = React.useState<"updated" | "priority" | "newest">("updated");

  const filtered = React.useMemo(() => {
    return complaints.filter((c) => {
      // Tab filter
      if (activeTab === "OPEN" && !OPEN_STATUSES.has(c.status)) return false;
      if (activeTab === "RESOLVED" && c.status !== "RESOLVED") return false;
      if (activeTab === "CLOSED" && c.status !== "CLOSED" && c.status !== "REJECTED") return false;

      // Category filter
      if (categoryFilter !== "ALL" && c.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRef = c.ref.toLowerCase().includes(q);
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchDesc = c.description.toLowerCase().includes(q);
        const matchLandmark = c.location.landmark?.toLowerCase().includes(q);
        if (!matchRef && !matchTitle && !matchDesc && !matchLandmark) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "priority") {
        return b.priority.score - a.priority.score;
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(b.statusChangedAt).getTime() - new Date(a.statusChangedAt).getTime();
    });
  }, [complaints, activeTab, categoryFilter, searchQuery, sortBy]);

  const counts = React.useMemo(() => {
    return {
      all: complaints.length,
      open: complaints.filter((c) => OPEN_STATUSES.has(c.status)).length,
      resolved: complaints.filter((c) => c.status === "RESOLVED").length,
      closed: complaints.filter((c) => c.status === "CLOSED" || c.status === "REJECTED").length,
    };
  }, [complaints]);

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {(
          [
            { key: "ALL", label: "All reports", count: counts.all },
            { key: "OPEN", label: "Open", count: counts.open },
            { key: "RESOLVED", label: "Resolved", count: counts.resolved },
            { key: "CLOSED", label: "Closed", count: counts.closed },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
              activeTab === tab.key
                ? "bg-primary text-white shadow-xs"
                : "bg-surface text-ink-muted hover:bg-surface-muted hover:text-ink"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-mono font-semibold ${
                activeTab === tab.key ? "bg-white text-primary" : "bg-surface-muted text-ink-muted"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference, title, or location..."
            className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-4 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-ink text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All categories</option>
              <option value="POTHOLE">Potholes</option>
              <option value="GARBAGE">Garbage</option>
              <option value="STREETLIGHT">Streetlights</option>
              <option value="DRAINAGE">Drainage</option>
              <option value="WATER_LEAK">Water supply</option>
              <option value="SANITATION">Sanitation</option>
              <option value="INFRASTRUCTURE">Infrastructure</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted">
            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
            <select
              aria-label="Sort complaints"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "updated" | "priority" | "newest")}
              className="bg-transparent text-ink text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="updated">Recently updated</option>
              <option value="priority">Highest priority</option>
              <option value="newest">Newest first</option>
            </select>
          </div>
        </div>
      </div>

      {/* List Content */}
      {filtered.length === 0 ? (
        <div className="rounded-md border border-border bg-surface p-12">
          <EmptyState
            title={
              activeTab === "OPEN"
                ? "No open reports"
                : activeTab === "RESOLVED"
                  ? "Nothing waiting for your confirmation"
                  : activeTab === "CLOSED"
                    ? "No closed reports yet"
                    : "No reports found"
            }
            body="All your civic reports will be listed here with live municipal tracking and verification status."
            action={
              <Button asChild size="sm">
                <Link href="/citizen/complaints/new">Report an issue</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface shadow-xs">
          {filtered.map((complaint) => (
            <Link
              key={complaint.id}
              href={`/citizen/complaints/${complaint.id}`}
              className="group flex flex-col gap-3 p-5 transition-colors hover:bg-surface-muted/50 focus-visible:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <ReferenceChip reference={complaint.ref} />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
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

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-muted">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>{complaint.location.landmark || complaint.location.wardName || "Bengaluru"}</span>
                  </span>
                  <span>{complaint.departmentName}</span>
                </div>
                <div className="flex items-center gap-3">
                  {complaint.supporterCount > 0 && (
                    <span className="font-medium text-ink">
                      {complaint.supporterCount} {complaint.supporterCount === 1 ? "supporter" : "supporters"}
                    </span>
                  )}
                  <span>Updated {new Date(complaint.statusChangedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
