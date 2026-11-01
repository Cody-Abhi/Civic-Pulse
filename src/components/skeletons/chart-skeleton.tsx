import { cn } from "@/lib/cn";

/** Chart area skeleton — bar chart style matching dashboard reference. */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-e1",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="skeleton-shimmer-light h-5 w-32 rounded bg-sunken" />
        <div className="skeleton-shimmer-light h-4 w-20 rounded bg-sunken" />
      </div>
      {/* Bar chart */}
      <div className="flex h-48 items-end gap-2 pt-4">
        {[65, 45, 80, 55, 70, 40, 90, 60, 75, 50, 85, 65].map((h, i) => (
          <div
            key={i}
            className="skeleton-shimmer-light flex-1 rounded-t bg-sunken"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer-light h-3 w-8 rounded bg-sunken" />
        ))}
      </div>
    </div>
  );
}
