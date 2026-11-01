"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Map as MapIcon,
  ThumbsUp,
  RotateCcw,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { ReferenceChip } from "@/components/ui/reference-chip";
import { DemoBadge } from "@/components/ui/demo-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { MetricStrip } from "@/components/data/metric-strip";
import type { Complaint } from "@/domain/types";

const CATEGORIES: { key: string; label: string }[] = [
  { key: "ALL", label: "All categories" },
  { key: "ROADS", label: "Roads & Footpaths" },
  { key: "WASTE", label: "Garbage & Waste" },
  { key: "DRAINAGE", label: "Drainage & Sewage" },
  { key: "STREETLIGHT", label: "Streetlights" },
  { key: "WATER", label: "Water supply" },
  { key: "TRAFFIC", label: "Traffic signals" },
  { key: "TREES", label: "Trees & Parks" },
  { key: "AIR_NOISE", label: "Air & Noise" },
  { key: "ANIMALS", label: "Stray animals" },
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
  "BTM Layout",
  "Hebbal",
];

const STATUSES = [
  { key: "ALL", label: "All statuses" },
  { key: "OPEN_ALL", label: "All open / active" },
  { key: "TRIAGED", label: "Triaged" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "CLOSED", label: "Closed" },
];

interface ExploreViewProps {
  initialComplaints: Complaint[];
}

export function ExploreView({ initialComplaints }: ExploreViewProps) {
  const [complaints, setComplaints] = React.useState<Complaint[]>(initialComplaints);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("ALL");
  const [ward, setWard] = React.useState("All Wards");
  const [status, setStatus] = React.useState("ALL");
  const [priorityBand, setPriorityBand] = React.useState("ALL");
  const [sortBy, setSortBy] = React.useState<"priority" | "recent" | "supported">("priority");
  const [supportedMap, setSupportedMap] = React.useState<Record<string, number>>({});
  const [supportingId, setSupportingId] = React.useState<string | null>(null);

  // Compute metrics
  const totalCount = complaints.length;
  const criticalCount = complaints.filter((c) => c.priority.band === "CRITICAL").length;
  const resolvedCount = complaints.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length;
  const totalVoices = complaints.reduce((sum, c) => sum + (c.supporterCount || 0) + (supportedMap[c.id] || 0), 0);

  // Filter complaints
  const filteredComplaints = React.useMemo(() => {
    let list = [...complaints];

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

    if (category !== "ALL") {
      list = list.filter((c) => c.category === category);
    }

    if (ward !== "All Wards") {
      list = list.filter((c) => c.location.wardName?.toLowerCase() === ward.toLowerCase());
    }

    if (status !== "ALL") {
      if (status === "OPEN_ALL") {
        list = list.filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED");
      } else {
        list = list.filter((c) => c.status === status);
      }
    }

    if (priorityBand !== "ALL") {
      list = list.filter((c) => c.priority.band === priorityBand);
    }

    if (sortBy === "recent") {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "supported") {
      list.sort((a, b) => {
        const countA = (a.supporterCount || 0) + (supportedMap[a.id] || 0);
        const countB = (b.supporterCount || 0) + (supportedMap[b.id] || 0);
        return countB - countA;
      });
    } else {
      list.sort((a, b) => b.priority.score - a.priority.score);
    }

    return list;
  }, [complaints, search, category, ward, status, priorityBand, sortBy, supportedMap]);

  const handleSupport = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (supportingId) return;

    setSupportingId(id);
    try {
      const res = await fetch(`/api/complaints/${id}/support`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSupportedMap((prev) => ({ ...prev, [id]: 1 }));
        setComplaints((prev) =>
          prev.map((c) => (c.id === id ? { ...c, supporterCount: data.supporterCount, priority: data.complaint.priority } : c)),
        );
      }
    } catch (err) {
      console.warn("Could not support issue:", err);
    } finally {
      setSupportingId(null);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategory("ALL");
    setWard("All Wards");
    setStatus("ALL");
    setPriorityBand("ALL");
    setSortBy("priority");
  };

  return (
    <div className="flex flex-col gap-6 py-6 md:py-10">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Public Ledger
            </span>
            <DemoBadge />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
            Explore civic issues in Bengaluru
          </h1>
          <p className="max-w-[72ch] text-sm text-ink-secondary sm:text-base">
            Every civic issue reported across 198 wards is scored objectively and prioritised for city teams.
            Support issues near you to help schedule prompt resolution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/explore/map">
            <Button variant="outline" className="h-11 gap-2 font-semibold shadow-xs">
              <Icon icon={MapIcon} size={16} />
              <span>Live map view</span>
            </Button>
          </Link>
          <Link href="/citizen/complaints/new">
            <Button className="h-11 gap-2 font-semibold shadow-xs">
              <Icon icon={Sparkles} size={16} />
              <span>Report an issue</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Inline Metric Strip ── */}
      <MetricStrip
        items={[
          {
            label: "Public reports",
            value: totalCount,
            hint: "Across Bengaluru pilot wards",
          },
          {
            label: "Critical priority",
            value: criticalCount,
            hint: "Score ≥ 70 · Expedited response",
          },
          {
            label: "Resolved issues",
            value: resolvedCount,
            hint: "Verified closed or completed",
          },
          {
            label: "Voices added",
            value: totalVoices,
            hint: "Citizen community upvotes",
          },
        ]}
      />

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search Bar */}
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <Icon icon={Search} size={16} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keyword, reference code, landmark or ward..."
              className="h-11 w-full rounded-lg border border-border bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Quick Clear */}
          {(search || category !== "ALL" || ward !== "All Wards" || status !== "ALL" || priorityBand !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-11 gap-1.5 text-xs text-muted hover:text-ink"
            >
              <Icon icon={RotateCcw} size={14} />
              Reset filters
            </Button>
          )}
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3">
          {/* Category Select */}
          <div className="flex flex-col gap-1">
            <label htmlFor="cat-filter" className="text-xs font-semibold text-muted">
              Category
            </label>
            <select
              id="cat-filter"
              aria-label="Filter by category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-md border border-border bg-canvas px-2.5 text-xs font-medium text-ink focus:border-primary focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ward Select */}
          <div className="flex flex-col gap-1">
            <label htmlFor="ward-filter" className="text-xs font-semibold text-muted">
              Ward
            </label>
            <select
              id="ward-filter"
              aria-label="Filter by ward"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="h-10 rounded-md border border-border bg-canvas px-2.5 text-xs font-medium text-ink focus:border-primary focus:outline-none"
            >
              {WARDS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div className="flex flex-col gap-1">
            <label htmlFor="status-filter" className="text-xs font-semibold text-muted">
              Status
            </label>
            <select
              id="status-filter"
              aria-label="Filter by status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-md border border-border bg-canvas px-2.5 text-xs font-medium text-ink focus:border-primary focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Select */}
          <div className="flex flex-col gap-1">
            <label htmlFor="sort-filter" className="text-xs font-semibold text-muted">
              Sort by
            </label>
            <select
              id="sort-filter"
              aria-label="Sort issues by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "priority" | "recent" | "supported")}
              className="h-10 rounded-md border border-border bg-canvas px-2.5 text-xs font-medium text-ink focus:border-primary focus:outline-none"
            >
              <option value="priority">Priority score (Highest)</option>
              <option value="recent">Most recently reported</option>
              <option value="supported">Most supported / voices</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Active Filter Summary & Result Count ── */}
      <div className="flex items-center justify-between text-xs text-muted px-1">
        <span>
          Showing <strong className="font-semibold text-ink">{filteredComplaints.length}</strong> of{" "}
          <strong className="font-semibold text-ink">{complaints.length}</strong> public issues
        </span>
        <span className="hidden sm:inline">Priority updated deterministically via 7-factor engine</span>
      </div>

      {/* ── Complaints Feed ── */}
      {filteredComplaints.length === 0 ? (
        <EmptyState
          title="No issues found matching your filters"
          body="Try clearing some filter criteria, searching for a different keyword, or report a new issue."
          action={
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Clear all filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredComplaints.map((item) => {
            const hasSupported = supportedMap[item.id] || (item.supporterUids && item.supporterUids.includes("demo-citizen-uid"));
            const totalSupporters = (item.supporterCount || 0) + (supportedMap[item.id] || 0);

            return (
              <Link
                key={item.id}
                href={`/complaints/${item.ref}`}
                className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-4 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex flex-col gap-3">
                  {/* Top Bar: Reference + Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <ReferenceChip reference={item.ref} />
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge band={item.priority.band} score={item.priority.score} size="sm" />
                      <StatusBadge status={item.status} size="sm" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="line-clamp-2 text-base font-bold text-ink group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  {/* Description preview */}
                  <p className="line-clamp-2 text-xs text-ink-secondary leading-relaxed">
                    {item.description}
                  </p>

                  {/* Location Info */}
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <Icon icon={MapPin} size={13} className="shrink-0 text-primary" />
                    <span className="truncate">
                      {item.location.landmark ? `${item.location.landmark}, ` : ""}
                      {item.location.wardName || "Bengaluru Ward"}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Supporter action + date */}
                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <button
                    type="button"
                    onClick={(e) => handleSupport(item.id, e)}
                    disabled={supportingId === item.id}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                      hasSupported
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "bg-surface-subtle text-ink-secondary hover:bg-primary/10 hover:text-primary border border-border"
                    }`}
                  >
                    <Icon icon={ThumbsUp} size={12} className={hasSupported ? "fill-primary" : ""} />
                    <span>{totalSupporters}</span>
                    <span className="hidden sm:inline">{hasSupported ? "Supported" : "Add voice"}</span>
                  </button>

                  <div className="flex items-center gap-1 text-xs font-medium text-muted">
                    <Icon icon={Calendar} size={12} />
                    <span>{new Date(item.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Public Disclaimer Notice ── */}
      <div className="rounded-xl border border-border/80 bg-surface-subtle p-4 text-center text-xs text-muted shadow-xs">
        Independent civic prototype · Not affiliated with BBMP, BDA or any government authority · All data shown is synthetic demo data.
      </div>
    </div>
  );
}
