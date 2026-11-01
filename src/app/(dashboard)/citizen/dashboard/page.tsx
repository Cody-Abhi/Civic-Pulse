import { DashboardSkeleton } from "@/components/skeletons";

/**
 * Citizen dashboard page.
 * Shows skeleton while data loads; real KPIs + charts replace once
 * Firebase is wired (T-07+). No mock data.
 */
export default function CitizenDashboardPage() {
  // TODO(T-07): Replace with real Firestore data via TanStack Query
  // For now, render the skeleton to show the dashboard loading state
  return <DashboardSkeleton />;
}
