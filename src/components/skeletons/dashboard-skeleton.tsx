import { MetricCardSkeletonLight } from "./metric-card-skeleton";
import { ChartSkeleton } from "./chart-skeleton";
import { MapSkeleton } from "./map-skeleton";
import { cn } from "@/lib/cn";

export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
          Citizen Dashboard
        </h1>
        <p className="text-sm text-muted">
          Here&apos;s an overview of civic reports and city activity.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <MetricCardSkeletonLight key={i} />
        ))}
      </div>

      {/* Chart + Map row */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <ChartSkeleton />
        </div>
        <div>
          <MapSkeleton className="h-full min-h-[300px]" />
        </div>
      </div>
    </div>
  );
}
