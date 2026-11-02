import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";

export default function CitizenLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <DashboardSkeleton />
    </div>
  );
}

