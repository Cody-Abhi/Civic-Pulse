import { TableSkeleton } from "@/components/skeletons/table-skeleton";

export default function PublicLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-56 max-w-full rounded bg-sunken" />
        <div className="h-4 w-full max-w-sm rounded bg-sunken" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-lg border border-border bg-surface p-4" />
        ))}
      </div>

      <TableSkeleton rows={6} />
    </div>
  );
}

