import type { Metadata } from "next";
import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoBadge } from "@/components/ui/demo-badge";
import { getAdminDepartments, getAdminCategories } from "@/server/services/admin";
import { DepartmentsClient } from "./departments-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Department Governance",
  description: "Configure municipal service delivery branches, category severity anchors, and SLA timeframes.",
};

export default async function AdminDepartmentsPage() {
  const departments = await getAdminDepartments();
  const categories = await getAdminCategories();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments & categories"
        description="Configure municipal service delivery branches, category severity anchors, and SLA timeframes."
        meta={<DemoBadge />}
      />

      <DepartmentsClient
        initialDepartments={departments}
        initialCategories={categories}
      />
    </div>
  );
}
