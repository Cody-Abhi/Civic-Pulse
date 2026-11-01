import { ComplaintDetailSkeleton } from "@/components/skeletons";

/**
 * Complaint detail page.
 * Shows skeleton loading state; real data replaces once Firestore
 * query is wired (T-07+). No mock data.
 */
export default function ComplaintDetailPage() {
  // TODO(T-07): Fetch complaint by ID from Firestore
  return <ComplaintDetailSkeleton />;
}
