import * as React from "react";
import { cn } from "@/lib/cn";
import { formatMetric, type MetricUnit } from "@/lib/format";

export interface MetricStripItem {
  label: string;
  value: number | null;
  unit?: MetricUnit;
  hint?: string;
}

/**
 * Inline primary metric strip (§15.3 anti-template rule): one row of stats
 * separated by dividers, not identical floating cards. Wraps to 2-up on mobile.
 */
export function MetricStrip({ items, className }: { items: MetricStripItem[]; className?: string }) {
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
