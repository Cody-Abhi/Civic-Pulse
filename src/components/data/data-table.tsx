"use client";

import { type ReactNode, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  hiddenBelow?: number;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyFn: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onSort?: (key: string, direction: "asc" | "desc") => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  keyFn,
  loading = false,
  error,
  onRetry,
  emptyTitle = "No records found",
  emptyDescription,
  onSort,
  sortKey,
  sortDirection,
  className,
}: DataTableProps<T>) {
  const [localSort, setLocalSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const activeKey = sortKey ?? localSort?.key;
  const activeDir = sortDirection ?? localSort?.dir;

  function handleSort(key: string) {
    const newDir = activeKey === key && activeDir === "asc" ? "desc" : "asc";
    if (onSort) {
      onSort(key, newDir);
    } else {
      setLocalSort({ key, dir: newDir });
    }
  }

  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-12 rounded-sm bg-sunken skeleton-shimmer-light" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted",
                  col.sortable && "cursor-pointer select-none hover:text-ink",
                  col.hiddenBelow && `hidden @[${col.hiddenBelow}px]:table-cell`,
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && activeKey === col.key && (
                    <Icon
                      icon={activeDir === "asc" ? ChevronUp : ChevronDown}
                      size={14}
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={keyFn(row)}
              className="border-b border-border/50 transition-colors hover:bg-sunken/50"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-3 py-2.5 text-ink",
                    col.hiddenBelow && `hidden @[${col.hiddenBelow}px]:table-cell`,
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
