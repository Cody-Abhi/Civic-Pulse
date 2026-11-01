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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { ReferenceChip } from "@/components/ui/reference-chip";
import { DemoBadge } from "@/components/ui/demo-badge";
import { DataTable } from "@/components/data/data-table";
import type { ColumnDef } from "@/components/data/data-table.types";
import type { Complaint } from "@/domain/types";

interface QueueViewProps {
  initialComplaints: Complaint[];
}

const CATEGORIES = [
  { key: "ALL", label: "All categories" },
  { key: "ROADS", label: "Roads & Footpaths" },
  { key: "DRAINAGE", label: "Drainage & Sewage" },
  { key: "STREETLIGHT", label: "Streetlights" },
  { key: "WASTE", label: "Garbage & Waste" },
  { key: "WATER", label: "Water supply" },
  { key: "TRAFFIC", label: "Traffic signals" },
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

export function QueueView({ initialComplaints }: QueueViewProps) {
  const router = useRouter();
  const [complaints] = React.useState<Complaint[]>(initialComplaints);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("ALL");
  const [ward, setWard] = React.useState("All Wards");
  const [statusTab, setStatusTab] = React.useState("ALL_ACTIVE");
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
  };

  // Columns definition for DataTable
  const columns: ColumnDef<Complaint>[] = [
    {
      id: "ref",
      header: "Reference",
      widthPx: 170,
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Priority Operational Queue
            </h1>
            <DemoBadge />
          </div>
          <p className="text-xs text-ink-secondary sm:text-sm">
            Ranked deterministically by 7-factor civic priority engine. Higher score tickets appear first.
          </p>
        </div>

        <Link href="/authority/map">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 font-semibold self-start sm:self-auto">
            <Icon icon={ExternalLink} size={14} />
            <span>Map View</span>
          </Button>
        </Link>
      </div>

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

      {/* ── Table / QueueCardList Container ── */}
      <DataTable<Complaint>
        columns={columns}
        rows={filteredRows}
        status="ready"
        sort={sort}
        onSortChange={setSort}
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
    </div>
  );
}
