import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoBadge } from "@/components/ui/demo-badge";
import { getComplaints } from "@/server/services/complaints";
import { getAdminDepartments } from "@/server/services/admin";
import { AdminComplaintsClient } from "./admin-complaints-client";

export default async function AdminComplaintsPage() {
  const complaints = await getComplaints();
  const departments = await getAdminDepartments();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaints oversight"
        description="Comprehensive city-wide complaint register, duplicate clusters review, and safety flagged reports."
        meta={<DemoBadge />}
      />

      <AdminComplaintsClient
        initialComplaints={complaints}
        departments={departments}
      />
    </div>
  );
}
