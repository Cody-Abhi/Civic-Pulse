import { MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

/** Map placeholder skeleton with subtle pin indicator. */
export function MapSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-lg border border-border bg-sunken",
        className,
      )}
      style={{ minHeight: "200px" }}
    >
      {/* Grid lines suggesting a map */}
      <div className="absolute inset-0 opacity-[0.04]" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute left-0 right-0 border-t border-border-strong"
            style={{ top: `${(i + 1) * 16}%` }}
          />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute bottom-0 top-0 border-l border-border-strong"
            style={{ left: `${(i + 1) * 16}%` }}
          />
        ))}
      </div>
      {/* Center pin */}
      <div className="flex flex-col items-center gap-2 opacity-30">
        <Icon icon={MapPin} size={24} className="text-primary" />
        <span className="text-xs font-medium text-muted">Loading Map...</span>
      </div>
      {/* Shimmer */}
      <div className="skeleton-shimmer-light absolute inset-0 opacity-50" />
    </div>
  );
}
