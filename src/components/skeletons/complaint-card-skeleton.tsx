import { cn } from "@/lib/cn";

/** Individual complaint card skeleton for list views. */
export function ComplaintCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-e1",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="skeleton-shimmer-light h-4 w-28 rounded bg-sunken" />
        <div className="skeleton-shimmer-light h-6 w-16 rounded-full bg-sunken" />
      </div>
      <div className="skeleton-shimmer-light h-5 w-3/4 rounded bg-sunken" />
      <div className="skeleton-shimmer-light h-4 w-full rounded bg-sunken" />
      <div className="flex items-center gap-3">
        <div className="skeleton-shimmer-light h-3 w-20 rounded bg-sunken" />
        <div className="skeleton-shimmer-light h-3 w-16 rounded bg-sunken" />
      </div>
    </div>
  );
}
