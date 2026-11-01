import * as React from "react";
import { cn } from "@/lib/cn";
import { formatMetric, type MetricUnit } from "@/lib/format";

export interface MetricStripItem {
  label: string;
  value: number | null;
  unit?: MetricUnit;
  hint?: string;
}

interface MetricStripProps {
  items: MetricStripItem[];
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export function MetricStrip({ items, loading = false, error, className }: MetricStripProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 gap-x-6 gap-y-5 rounded-md border border-border bg-surface p-5 sm:grid-cols-4",
          className,
        )}
      >
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-3 w-16 rounded-xs bg-sunken skeleton-shimmer-light" />
            <div className="h-7 w-20 rounded-xs bg-sunken skeleton-shimmer-light" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded-md border border-danger/20 bg-danger-bg px-5 py-4 text-sm text-danger", className)}>
        {error}
      </div>
    );
  }

  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-5 rounded-md border border-border bg-surface p-5 sm:flex sm:flex-wrap sm:items-center",
        className,
      )}
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn("flex flex-col gap-1", i > 0 && "sm:border-l sm:border-border sm:pl-6")}
        >
          <dt className="text-sm text-muted" title={item.hint}>
            {item.label}
          </dt>
          <dd className="text-2xl font-semibold tracking-[-0.01em] text-ink tabular-nums">
            {formatMetric(item.value, item.unit)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
