import { cn } from "@/lib/cn";

/** Table/list skeleton for complaints, notifications, etc. */
export function TableSkeleton({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0 overflow-hidden rounded-lg border border-border bg-surface shadow-e1",
        className,
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-4 border-b border-border px-5 py-3">
        {[80, 120, 100, 60, 80].map((w, i) => (
          <div
            key={i}
            className="skeleton-shimmer-light h-3 rounded bg-sunken"
            style={{ width: w }}
          />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div
          key={ri}
          className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-b-0"
        >
          <div className="skeleton-shimmer-light h-4 w-20 rounded bg-sunken" />
          <div className="skeleton-shimmer-light h-4 flex-1 rounded bg-sunken" />
          <div className="skeleton-shimmer-light h-4 w-24 rounded bg-sunken" />
          <div className="skeleton-shimmer-light h-6 w-16 rounded-full bg-sunken" />
          <div className="skeleton-shimmer-light h-4 w-16 rounded bg-sunken" />
        </div>
      ))}
    </div>
  );
}
