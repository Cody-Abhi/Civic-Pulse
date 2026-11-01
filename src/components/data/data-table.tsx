"use client";

import * as React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { QueueCardList } from "./queue-card-list";
import type { DataTableProps, ColumnDef } from "./data-table.types";

/**
 * Responsive column visibility classes
 */
function getResponsiveHideClass(hideBelow?: ColumnDef<unknown>["hideBelow"]): string {
  switch (hideBelow) {
    case "md":
      return "hidden md:table-cell";
    case "lg":
      return "hidden lg:table-cell";
    case "xl":
      return "hidden xl:table-cell";
    default:
      return "";
  }
}

/**
 * DataTable (§17.1, §17.2)
 * Accessible, keyboard-navigable server-driven table.
 * Swaps to QueueCardList below 768px.
 */
export function DataTable<Row extends { id: string }>({
  columns,
  rows,
  status,
  error,
  onRetry,
  sort,
  onSortChange,
  selectable = false,
  selectedIds,
  onSelectionChange,
  onRowOpen,
  pagination,
  empty,
  mobileRow,
  caption,
  className,
}: DataTableProps<Row>) {
  // Sort handler
  const handleSort = (col: ColumnDef<Row>) => {
    if (!col.sortable || !onSortChange) return;
    const field = col.sortField ?? col.id;
    if (sort?.field === field) {
      onSortChange({
        field,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
    } else {
      onSortChange({ field, direction: "desc" });
    }
  };

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;
    if (e.target.checked) {
      onSelectionChange(new Set(rows.map((r) => r.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  // Error state
  if (status === "error") {
    return (
      <ErrorState
        title="Failed to load records"
        body={error?.message ?? "An error occurred while loading table data."}
        onRetry={onRetry}
        variant="panel"
        className={className}
      />
    );
  }

  // Empty state
  if (status === "ready" && rows.length === 0) {
    return (
      <div className={cn("rounded-md border border-border bg-surface", className)}>
        <EmptyState
          title={empty.title}
          body={empty.body}
          action={empty.action}
          variant="panel"
        />
      </div>
    );
  }

  const allSelected =
    rows.length > 0 && selectedIds && rows.every((r) => selectedIds.has(r.id));
  const someSelected =
    Boolean(selectedIds && selectedIds.size > 0 && !allSelected);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Mobile Card List (< 768px) */}
      {mobileRow && (
        <div className="block md:hidden">
          {status === "loading" ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-md border border-border bg-surface p-4">
                  <Skeleton className="h-5 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <QueueCardList
              rows={rows}
              renderCard={mobileRow}
              onCardClick={onRowOpen}
            />
          )}
        </div>
      )}

      {/* Desktop / Tablet Table (>= 768px or if no mobileRow provided) */}
      <div
        className={cn(
          "relative overflow-x-auto rounded-md border border-border bg-surface shadow-xs",
          mobileRow ? "hidden md:block" : "block",
        )}
      >
        <table className="w-full text-left border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-border bg-sunken/60 text-xs font-semibold text-muted">
            <tr>
              {selectable && (
                <th scope="col" className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAll}
                    aria-label="Select all rows"
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                </th>
              )}

              {columns.map((col) => {
                const isSorted = sort?.field === (col.sortField ?? col.id);
                return (
                  <th
                    key={col.id}
                    scope="col"
                    style={col.widthPx ? { width: `${col.widthPx}px` } : undefined}
                    className={cn(
                      "px-4 py-3 font-semibold",
                      col.align === "end" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                      getResponsiveHideClass(col.hideBelow),
                    )}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col)}
                        className="inline-flex items-center gap-1.5 hover:text-ink focus:outline-none focus:text-ink font-semibold"
                        aria-label={`Sort by ${col.header}`}
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sort.direction === "asc" ? (
                            <Icon icon={ArrowUp} size={14} className="text-primary" />
                          ) : (
                            <Icon icon={ArrowDown} size={14} className="text-primary" />
                          )
                        ) : (
                          <Icon icon={ArrowUpDown} size={13} className="opacity-40" />
                        )}
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {status === "loading"
              ? Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={`skel-${rIdx}`}>
                    {selectable && (
                      <td className="px-4 py-3.5 text-center">
                        <Skeleton className="h-4 w-4 mx-auto" />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={`skel-${rIdx}-${col.id}`}
                        className={cn("px-4 py-3.5", getResponsiveHideClass(col.hideBelow))}
                      >
                        <Skeleton className="h-4 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => {
                  const isSelected = selectedIds?.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      onClick={onRowOpen ? () => onRowOpen(row) : undefined}
                      className={cn(
                        "transition-colors",
                        onRowOpen && "cursor-pointer hover:bg-sunken/40",
                        isSelected && "bg-primary-subtle/30",
                      )}
                    >
                      {selectable && (
                        <td
                          className="px-4 py-3 text-center"
                          onClick={(e) => handleSelectRow(row.id, e)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            aria-label={`Select row ${row.id}`}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={`${row.id}-${col.id}`}
                          className={cn(
                            "px-4 py-3 text-ink",
                            col.align === "end" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                            getResponsiveHideClass(col.hideBelow),
                          )}
                        >
                          {col.cell(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-1 text-xs text-muted">
          <span>
            Showing {rows.length} record{rows.length === 1 ? "" : "s"}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev || status === "loading"}
              onClick={pagination.onPrev}
              className="h-8 gap-1 px-2.5"
            >
              <Icon icon={ChevronLeft} size={14} />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext || status === "loading"}
              onClick={pagination.onNext}
              className="h-8 gap-1 px-2.5"
            >
              Next
              <Icon icon={ChevronRight} size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export * from "./data-table.types";
