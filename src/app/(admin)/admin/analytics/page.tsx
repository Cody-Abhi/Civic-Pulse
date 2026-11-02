import type { Metadata } from "next";
import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoBadge } from "@/components/ui/demo-badge";
import { getComplaints, getWardStats } from "@/server/services/complaints";
import { getAdminDepartments } from "@/server/services/admin";
import { AdminAnalyticsClient } from "./admin-analytics-client";

export const metadata: Metadata = {
  title: "City Performance Analytics",
  description: "Cross-departmental performance metrics, SLA compliance benchmarks, and ward resolution trends.",
};

export default async function AdminAnalyticsPage() {
  const complaints = await getComplaints();
  const departments = await getAdminDepartments();
  const wardStats = await getWardStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title="City analytics"
        description="Cross-departmental performance metrics, SLA compliance benchmarks, and ward resolution trends."
        meta={<DemoBadge />}
      />

      <AdminAnalyticsClient
        complaints={complaints}
        departments={departments}
        wardStats={wardStats}
      />
    </div>
  );
}
