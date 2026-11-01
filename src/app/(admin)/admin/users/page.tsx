import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoBadge } from "@/components/ui/demo-badge";
import { listAdminUsers, getAdminDepartments } from "@/server/services/admin";
import { UsersClient } from "./users-client";

export default async function AdminUsersPage() {
  const { users } = listAdminUsers();
  const departments = await getAdminDepartments();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & roles"
        description="Manage user accounts, assign municipal departments, and adjust platform governance permissions."
        meta={<DemoBadge />}
      />

      <UsersClient initialUsers={users} departments={departments} />
    </div>
  );
}
