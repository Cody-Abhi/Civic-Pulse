import * as React from "react";
import { cn } from "@/lib/cn";
import { formatMetric, type MetricUnit } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export interface MetricStripItem {
  label: string;
  value: number | string | null;
  unit?: MetricUnit | undefined;
  delta?: { value: number | string; label?: string | undefined; isPositive?: boolean | undefined } | undefined;
  hint?: string | undefined;
}

export interface MetricStripProps {
  items: MetricStripItem[];
  loading?: boolean;
  className?: string;
}

/**
 * MetricStrip (§15.3, §17.1)
 * Accessible inline primary metric strip replacing generic floating cards.
 * Tabular numerals, delta badges, and accessible loading state.
 */
export function MetricStrip({ items, loading = false, className }: MetricStripProps) {
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
          className={cn(
            "flex flex-1 flex-col gap-1 min-w-[140px]",
            i > 0 && "sm:border-l sm:border-border sm:pl-6",
          )}
        >
          <dt className="text-xs font-medium text-muted" title={item.hint}>
            {item.label}
          </dt>
          <dd className="flex items-baseline gap-2">
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <span className="font-mono text-2xl font-bold tracking-tight text-ink tabular-nums md:text-3xl">
                  {typeof item.value === "number"
                    ? formatMetric(item.value, item.unit)
                    : (item.value ?? "—")}
                </span>
                {item.delta && (
                  <span
                    className={cn(
                      "text-[11px] font-semibold",
                      item.delta.isPositive ? "text-success" : "text-muted",
                    )}
                  >
                    {item.delta.value}
                  </span>
                )}
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
