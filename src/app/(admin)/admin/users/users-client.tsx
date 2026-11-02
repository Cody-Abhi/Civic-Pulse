"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { DataTable } from "@/components/data/data-table";
import type { ColumnDef } from "@/components/data/data-table.types";
import { QueueCardList } from "@/components/data/queue-card-list";
import { Button } from "@/components/ui/button";
import type { AdminUser, Department, Role } from "@/domain/types";

interface AdminUserRow extends AdminUser {
  id: string;
}

interface UsersClientProps {
  initialUsers: AdminUser[];
  departments: Department[];
}

export function UsersClient({ initialUsers, departments }: UsersClientProps) {
  const [users, setUsers] = React.useState<AdminUser[]>(initialUsers);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [deptFilter, setDeptFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Dialog states
  const [selectedUser, setSelectedUser] = React.useState<AdminUser | null>(null);
  const [dialogMode, setDialogMode] = React.useState<"role" | "status" | null>(null);
  const [newRole, setNewRole] = React.useState<Role>("citizen");
  const [newDepartmentId, setNewDepartmentId] = React.useState<string>("");
  const [statusReason, setStatusReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const activeAdminsCount = users.filter((u) => u.role === "admin" && u.status === "active").length;

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      if (search) {
        const q = search.toLowerCase();
        const matches =
          (u.displayName || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.departmentId && u.departmentId.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (deptFilter !== "all" && u.departmentId !== deptFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, search, roleFilter, deptFilter, statusFilter]);

  const handleOpenRoleDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setNewDepartmentId(user.departmentId || "roads");
    setErrorMessage(null);
    setDialogMode("role");
  };

  const handleOpenStatusDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setStatusReason("");
    setErrorMessage(null);
    setDialogMode("status");
  };

  const handleSubmitRole = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.uid}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: newRole,
          departmentId: newRole === "authority" ? newDepartmentId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update role");
      }

      setUsers((prev) =>
        prev.map((u) => (u.uid === selectedUser.uid ? { ...u, ...data.user } : u)),
      );
      setDialogMode(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitStatus = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const targetStatus = selectedUser.status === "active" ? "suspended" : "active";

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.uid}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          reason: statusReason || "Administrative decision",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setUsers((prev) =>
        prev.map((u) => (u.uid === selectedUser.uid ? { ...u, ...data.user } : u)),
      );
      setDialogMode(null);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<AdminUserRow>[] = [
    {
      id: "name",
      header: "User",
      cell: (row) => (
        <div>
          <div className="font-medium text-foreground">{row.displayName}</div>
          <div className="text-xs text-muted-foreground">{row.email}</div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            row.role === "admin"
              ? "bg-purple-100 text-purple-800"
              : row.role === "authority"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
          }`}
        >
          {(row.role || "citizen").toUpperCase()}
        </span>
      ),
    },
    {
      id: "department",
      header: "Department",
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.departmentId ? row.departmentId.toUpperCase() : "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            row.status === "active"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-rose-100 text-rose-800"
          }`}
        >
          {row.status === "active" ? "Active" : "Suspended"}
        </span>
      ),
    },
    {
      id: "complaints",
      header: "Reports",
      cell: (row) => <span className="font-mono text-xs">{row.complaintsFiled}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => {
        const isSoleAdmin = row.role === "admin" && activeAdminsCount <= 1;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isSoleAdmin}
              title={isSoleAdmin ? "Cannot modify the sole administrator" : undefined}
              onClick={() => handleOpenRoleDialog(row)}
            >
              Role
            </Button>
            <Button
              variant={row.status === "active" ? "ghost" : "primary"}
              size="sm"
              disabled={isSoleAdmin}
              title={isSoleAdmin ? "Cannot suspend the sole administrator" : undefined}
              onClick={() => handleOpenStatusDialog(row)}
            >
              {row.status === "active" ? "Suspend" : "Activate"}
            </Button>
          </div>
        );
      },
    },
  ];

  const tableRows = React.useMemo<AdminUserRow[]>(
    () => filteredUsers.map((u) => ({ ...u, id: u.uid })),
    [filteredUsers],
  );

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="user-search" className="mb-1 block text-xs font-medium text-muted-foreground">
            Search
          </label>
          <input
            id="user-search"
            type="text"
            placeholder="Search name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="user-role" className="mb-1 block text-xs font-medium text-muted-foreground">
            Role
          </label>
          <select
            id="user-role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All roles</option>
            <option value="citizen">Citizen</option>
            <option value="authority">Authority</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div>
          <label htmlFor="user-dept" className="mb-1 block text-xs font-medium text-muted-foreground">
            Department
          </label>
          <select
            id="user-dept"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="user-status" className="mb-1 block text-xs font-medium text-muted-foreground">
            Status
          </label>
          <select
            id="user-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Desktop Table (>= 768px) */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          rows={tableRows}
          status="ready"
          caption="Platform User Accounts Register"
          empty={{ title: "No users found" }}
        />
      </div>

      {/* Mobile Card List (< 768px) */}
      <div className="md:hidden">
        <QueueCardList
          rows={tableRows}
          onCardClick={(user) => handleOpenRoleDialog(user)}
          renderCard={(user) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{user.displayName}</span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.status === "active"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {user.status === "active" ? "Active" : "Suspended"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold uppercase text-primary">{user.role || "citizen"}</span>
                {user.departmentId && (
                  <span className="text-muted-foreground">&middot; {user.departmentId.toUpperCase()}</span>
                )}
              </div>
            </div>
          )}
        />
      </div>

      {/* Role Change Modal */}
      {dialogMode === "role" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface-card p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground">Change user role</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Modify permissions for <strong className="text-foreground">{selectedUser.displayName}</strong>.
            </p>

            {errorMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="change-role-select" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Select new role
                </label>
                <select
                  id="change-role-select"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
                >
                  <option value="citizen">Citizen</option>
                  <option value="authority">Authority (Department Official)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {newRole === "authority" && (
                <div>
                  <label htmlFor="change-dept-select" className="mb-1 block text-xs font-medium text-muted-foreground">
                    Assigned department
                  </label>
                  <select
                    id="change-dept-select"
                    value={newDepartmentId}
                    onChange={(e) => setNewDepartmentId(e.target.value)}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <p className="text-xs text-amber-700">
                Note: The user will be required to sign in again to receive updated role permissions.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDialogMode(null)}>
                Cancel
              </Button>
              <Button variant="primary" disabled={isSubmitting} onClick={handleSubmitRole}>
                {isSubmitting ? "Updating..." : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend / Reactivate Modal */}
      {dialogMode === "status" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface-card p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground">
              {selectedUser.status === "active" ? "Suspend user account" : "Reactivate user account"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedUser.status === "active"
                ? `Suspending ${selectedUser.displayName} will block all complaint submissions and sign-ins.`
                : `Reactivating ${selectedUser.displayName} will restore normal access to the platform.`}
            </p>

            {errorMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="mt-4">
              <label htmlFor="status-reason-input" className="mb-1 block text-xs font-medium text-muted-foreground">
                Administrative reason (logged in audit trail)
              </label>
              <textarea
                id="status-reason-input"
                rows={3}
                placeholder="Reason for suspension or reactivation..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDialogMode(null)}>
                Cancel
              </Button>
              <Button
                variant={selectedUser.status === "active" ? "primary" : "outline"}
                disabled={isSubmitting}
                onClick={handleSubmitStatus}
              >
                {isSubmitting
                  ? "Processing..."
                  : selectedUser.status === "active"
                    ? "Confirm suspension"
                    : "Confirm reactivation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
