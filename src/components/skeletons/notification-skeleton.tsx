import { cn } from "@/lib/cn";

/** Notification list skeleton. */
export function NotificationSkeleton({
  count = 5,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 shadow-e1"
        >
          <div className="skeleton-shimmer-light h-10 w-10 shrink-0 rounded-full bg-sunken" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="skeleton-shimmer-light h-4 w-3/4 rounded bg-sunken" />
            <div className="skeleton-shimmer-light h-3 w-1/2 rounded bg-sunken" />
          </div>
          <div className="skeleton-shimmer-light h-3 w-12 rounded bg-sunken" />
        </div>
      ))}
    </div>
  );
}
