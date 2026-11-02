import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { MetricCardSkeletonLight } from "@/components/skeletons/metric-card-skeleton";

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-56 max-w-full rounded bg-sunken" />
        <div className="h-4 w-full max-w-sm rounded bg-sunken" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <MetricCardSkeletonLight key={i} />
        ))}
      </div>

      <TableSkeleton rows={8} />
    </div>
  );
}

