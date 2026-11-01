"use client";

import * as React from "react";
import { Building2, Tags, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Department, CategoryConfig, ComplaintCategory, Severity } from "@/domain/types";

interface DepartmentsClientProps {
  initialDepartments: Department[];
  initialCategories: Record<ComplaintCategory, CategoryConfig>;
}

export function DepartmentsClient({
  initialDepartments,
  initialCategories,
}: DepartmentsClientProps) {
  const [activeTab, setActiveTab] = React.useState<"departments" | "categories">("departments");
  const [departments, setDepartments] = React.useState<Department[]>(initialDepartments);
  const [categories, setCategories] = React.useState<Record<ComplaintCategory, CategoryConfig>>(initialCategories);

  // Department edit modal
  const [editingDept, setEditingDept] = React.useState<Department | null>(null);
  const [deptName, setDeptName] = React.useState("");
  const [deptDesc, setDeptDesc] = React.useState("");
  const [deptActive, setDeptActive] = React.useState(true);

  // Category edit modal
  const [editingCatKey, setEditingCatKey] = React.useState<ComplaintCategory | null>(null);
  const [catSeverity, setCatSeverity] = React.useState<Severity>(3);
  const [catSlaHours, setCatSlaHours] = React.useState<number>(72);
  const [catDeptId, setCatDeptId] = React.useState<string>("roads");
  const [catTimeSensitive, setCatTimeSensitive] = React.useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleOpenDeptEdit = (dept: Department) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptDesc(dept.description || "");
    setDeptActive(dept.active);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleOpenCatEdit = (key: ComplaintCategory) => {
    const config = categories[key];
    setEditingCatKey(key);
    setCatSeverity(config.baseSeverity);
    setCatSlaHours(config.slaHours);
    setCatDeptId(config.departmentId);
    setCatTimeSensitive(config.timeSensitive);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSaveDepartment = async () => {
    if (!editingDept) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/departments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingDept.id,
          name: deptName,
          description: deptDesc,
          active: deptActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update department");
      }

      setDepartments((prev) =>
        prev.map((d) => (d.id === editingDept.id ? { ...d, ...data.department } : d)),
      );
      setEditingDept(null);
      setSuccessMessage(`Department '${editingDept.name}' updated successfully.`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!editingCatKey) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/categories/${editingCatKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseSeverity: catSeverity,
          slaHours: catSlaHours,
          departmentId: catDeptId,
          timeSensitive: catTimeSensitive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update category configuration");
      }

      setCategories((prev) => ({
        ...prev,
        [editingCatKey]: data.category,
      }));
      setEditingCatKey(null);
      setSuccessMessage(`Category '${editingCatKey}' settings saved and priorities updated.`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("departments")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "departments"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Departments ({departments.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "categories"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tags className="h-4 w-4" />
          <span>Categories ({Object.keys(categories).length})</span>
        </button>
      </div>

      {/* Departments Table */}
      {activeTab === "departments" && (
        <div className="rounded-xl border border-border bg-surface-card p-5 shadow-xs">
          <div className="overflow-x-auto focus:outline-none focus:ring-1 focus:ring-primary rounded-md" tabIndex={0} role="region" aria-label="Departments directory table">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-medium text-muted-foreground">
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Code</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Engineers</th>
                  <th className="pb-3 text-right">Open</th>
                  <th className="pb-3 text-right">Overdue</th>
                  <th className="pb-3 text-right">SLA Adherence</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-muted/40">
                    <td className="py-3 font-medium text-foreground">
                      <div>{dept.name}</div>
                      <div className="max-w-md truncate text-xs text-muted-foreground">
                        {dept.description}
                      </div>
                    </td>
                    <td className="py-3 font-mono text-xs">{dept.code}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          dept.active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {dept.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-xs">{dept.authoritiesCount}</td>
                    <td className="py-3 text-right font-mono text-xs">{dept.openComplaints}</td>
                    <td className="py-3 text-right font-mono text-xs text-critical">
                      {dept.overdueComplaints}
                    </td>
                    <td className="py-3 text-right font-mono text-xs font-semibold">
                      {dept.slaComplianceRate}%
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDeptEdit(dept)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories Table */}
      {activeTab === "categories" && (
        <div className="rounded-xl border border-border bg-surface-card p-5 shadow-xs">
          <div className="overflow-x-auto focus:outline-none focus:ring-1 focus:ring-primary rounded-md" tabIndex={0} role="region" aria-label="Categories configuration table">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-medium text-muted-foreground">
                  <th className="pb-3">Category Key</th>
                  <th className="pb-3">Default Department</th>
                  <th className="pb-3 text-center">Base Severity (1–5)</th>
                  <th className="pb-3 text-center">SLA Target</th>
                  <th className="pb-3 text-center">Monsoon Sensitive</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(Object.keys(categories) as ComplaintCategory[]).map((catKey) => {
                  const cfg = categories[catKey];
                  return (
                    <tr key={catKey} className="hover:bg-muted/40">
                      <td className="py-3 font-mono text-xs font-semibold text-foreground">
                        {catKey}
                      </td>
                      <td className="py-3 text-xs capitalize text-muted-foreground">
                        {departments.find((d) => d.id === cfg.departmentId)?.name || cfg.departmentId}
                      </td>
                      <td className="py-3 text-center">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                          {cfg.baseSeverity}
                        </span>
                      </td>
                      <td className="py-3 text-center font-mono text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {cfg.slaHours} hours
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                            cfg.timeSensitive
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {cfg.timeSensitive ? "Yes (Jun–Nov)" : "Standard"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenCatEdit(catKey)}>
                          Configure
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface-card p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground">Edit department</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure parameters for <strong className="text-foreground">{editingDept.code}</strong>.
            </p>

            {errorMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="dept-name-input" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Department name
                </label>
                <input
                  id="dept-name-input"
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor="dept-desc-input" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Mandate & description
                </label>
                <textarea
                  id="dept-desc-input"
                  rows={3}
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dept-active"
                  checked={deptActive}
                  onChange={(e) => setDeptActive(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="dept-active" className="text-sm font-medium text-foreground">
                  Department operational (Active)
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditingDept(null)}>
                Cancel
              </Button>
              <Button variant="primary" disabled={isSubmitting} onClick={handleSaveDepartment}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCatKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface-card p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground">Configure category: {editingCatKey}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Adjust base severity weighting and SLA resolution thresholds.
            </p>

            {errorMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="cat-dept-select" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Default responsible department
                </label>
                <select
                  id="cat-dept-select"
                  value={catDeptId}
                  onChange={(e) => setCatDeptId(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cat-severity-select" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Base severity (1 to 5)
                </label>
                <select
                  id="cat-severity-select"
                  value={catSeverity}
                  onChange={(e) => setCatSeverity(Number(e.target.value) as Severity)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
                >
                  <option value={1}>1 - Low / Routine</option>
                  <option value={2}>2 - Minor Inconvenience</option>
                  <option value={3}>3 - Moderate Impact</option>
                  <option value={4}>4 - High Disruption</option>
                  <option value={5}>5 - Critical / Safety Hazard</option>
                </select>
              </div>

              <div>
                <label htmlFor="cat-sla-input" className="mb-1 block text-xs font-medium text-muted-foreground">
                  SLA target (hours)
                </label>
                <input
                  id="cat-sla-input"
                  type="number"
                  min={12}
                  max={336}
                  value={catSlaHours}
                  onChange={(e) => setCatSlaHours(Number(e.target.value))}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cat-time-sensitive"
                  checked={catTimeSensitive}
                  onChange={(e) => setCatTimeSensitive(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="cat-time-sensitive" className="text-sm font-medium text-foreground">
                  Monsoon time-sensitive (+multiplier in wet season)
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditingCatKey(null)}>
                Cancel
              </Button>
              <Button variant="primary" disabled={isSubmitting} onClick={handleSaveCategory}>
                {isSubmitting ? "Updating..." : "Apply & Recalculate"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
