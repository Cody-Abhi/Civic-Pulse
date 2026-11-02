import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoBadge } from "@/components/ui/demo-badge";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/server/auth/session";
import { listComplaints } from "@/server/services/complaints";
import { ComplaintsListView } from "./complaints-list-view";

export const metadata = {
  title: "My Reports",
  description: "Review, filter, and track all your submitted civic reports and their municipal resolution progress.",
};

export default async function CitizenComplaintsPage() {
  const user = await getSessionUser();
  const userId = user?.uid || "demo-citizen-uid";

  const complaints = await listComplaints({
    userId,
    limit: 100,
  });

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="My reports"
        description="Track all issues you have filed, review department updates, and verify ground fixes."
        meta={<DemoBadge />}
        actions={
          <Button asChild className="gap-2">
            <Link href="/citizen/complaints/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Report an issue</span>
            </Link>
          </Button>
        }
      />

      <ComplaintsListView complaints={complaints} />
    </div>
  );
}
