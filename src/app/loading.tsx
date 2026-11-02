import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { MetricCardSkeletonLight } from "@/components/skeletons/metric-card-skeleton";

export default function RootLoading() {
  return (
    <div className="flex w-full flex-col gap-6 p-6 md:p-8 animate-pulse">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 rounded bg-sunken" />
        <div className="h-4 w-72 rounded bg-sunken" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <MetricCardSkeletonLight key={i} />
        ))}
      </div>

      <TableSkeleton rows={4} />
    </div>
  );
}

