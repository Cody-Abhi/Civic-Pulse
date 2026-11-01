import { cn } from "@/lib/cn";

/** Profile page skeleton. */
export function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="skeleton-shimmer-light h-16 w-16 rounded-full bg-sunken" />
        <div className="flex flex-col gap-2">
          <div className="skeleton-shimmer-light h-5 w-40 rounded bg-sunken" />
          <div className="skeleton-shimmer-light h-3 w-28 rounded bg-sunken" />
        </div>
      </div>
      {/* Fields */}
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 shadow-e1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="skeleton-shimmer-light h-3 w-20 rounded bg-sunken" />
            <div className="skeleton-shimmer-light h-10 w-full rounded-lg bg-sunken" />
          </div>
        ))}
      </div>
    </div>
  );
}
