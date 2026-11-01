"use client";

import * as React from "react";
import { useState } from "react";
import { BarChart3, Table, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";

export interface ChartDataTable {
  columns: string[];
  rows: (string | number)[][];
}

export interface ChartFrameProps {
  title: string;
  description?: string;
  table: ChartDataTable;
  children: React.ReactNode;
  loading?: boolean;
  error?: string;
  className?: string;
}

/**
 * ChartFrame (§17.1)
 * Accessible chart container that pairs visual charts with an accessible data table.
 * Meets WCAG 2.2 AA requirement for alternative accessible presentation.
 */
export function ChartFrame({
  title,
  description,
  table,
  children,
  loading = false,
  error,
  className,
}: ChartFrameProps) {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <div
      className={cn(
        "flex flex-col rounded-md border border-border bg-surface p-5 shadow-xs",
        className,
      )}
    >
      {/* Header with Title and Accessible Toggle */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          {description && <p className="text-xs text-muted leading-relaxed">{description}</p>}
        </div>

        <div className="flex items-center rounded-sm border border-border bg-sunken p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setView("chart")}
            aria-pressed={view === "chart"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xs px-2.5 py-1 font-medium transition-colors",
              view === "chart"
                ? "bg-surface text-primary shadow-xs font-semibold"
                : "text-muted hover:text-ink",
            )}
          >
            <Icon icon={BarChart3} size={14} />
            <span>Chart</span>
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            aria-pressed={view === "table"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xs px-2.5 py-1 font-medium transition-colors",
              view === "table"
                ? "bg-surface text-primary shadow-xs font-semibold"
                : "text-muted hover:text-ink",
            )}
          >
            <Icon icon={Table} size={14} />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative min-h-[240px] flex-1">
        {loading ? (
          <div className="flex h-full w-full flex-col justify-end gap-3 pt-6">
            <Skeleton className="h-40 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ) : error ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-muted">
            <Icon icon={AlertCircle} size={24} className="text-danger" />
            <p className="text-xs text-danger font-medium">{error}</p>
          </div>
        ) : view === "chart" ? (
          <div className="h-full w-full">{children}</div>
        ) : (
          <div className="overflow-x-auto rounded-xs border border-border">
            <table className="w-full text-left text-xs border-collapse">
              <caption className="sr-only">{title} data table</caption>
              <thead className="border-b border-border bg-sunken text-muted">
                <tr>
                  {table.columns.map((col, idx) => (
                    <th key={idx} scope="col" className="px-3 py-2 font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {table.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-sunken/40">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-ink font-mono tabular-nums">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
