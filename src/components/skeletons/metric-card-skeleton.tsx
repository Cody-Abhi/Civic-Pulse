import { cn } from "@/lib/cn";

/** Metric card skeleton matching KpiCard dimensions. */
export function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-5",
        className,
      )}
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="skeleton-shimmer h-4 w-24 rounded"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        />
        <div
          className="skeleton-shimmer h-5 w-5 rounded"
          style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
        />
      </div>
      <div
        className="skeleton-shimmer h-8 w-20 rounded"
        style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
      />
      <div
        className="skeleton-shimmer h-3 w-16 rounded"
        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
      />
    </div>
  );
}

/** Light-surface variant for the main app dashboard. */
export function MetricCardSkeletonLight({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-e1",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="skeleton-shimmer-light h-4 w-24 rounded bg-sunken" />
        <div className="skeleton-shimmer-light h-5 w-5 rounded bg-sunken" />
      </div>
      <div className="skeleton-shimmer-light h-8 w-20 rounded bg-sunken" />
      <div className="skeleton-shimmer-light h-3 w-16 rounded bg-sunken" />
    </div>
  );
}
