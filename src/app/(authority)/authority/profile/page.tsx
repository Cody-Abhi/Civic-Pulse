"use client";

import * as React from "react";
import { Building2, Bell, CheckCircle2, Mail, Save, Loader2, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoBadge } from "@/components/ui/demo-badge";
import { Button } from "@/components/ui/button";

export default function AuthorityProfilePage() {
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("roads");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [notifyQueue, setNotifyQueue] = React.useState(true);
  const [notifySla, setNotifySla] = React.useState(true);
  const [statusMsg, setStatusMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) {
          setDisplayName(d.user.displayName || "Municipal Officer");
          setEmail(d.user.email || "roads@demo.civicpulse.invalid");
          if (d.user.departmentId) setDepartmentId(d.user.departmentId);
          if (d.user.prefs?.notifyQueue !== undefined) setNotifyQueue(d.user.prefs.notifyQueue);
          if (d.user.prefs?.notifySla !== undefined) setNotifySla(d.user.prefs.notifySla);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          prefs: {
            notifyQueue,
            notifySla,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile settings");
      setStatusMsg({ type: "success", text: "Authority profile updated successfully." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error saving profile";
      setStatusMsg({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  const getDepartmentLabel = (id: string) => {
    switch (id) {
      case "roads":
        return "BBMP Major Roads & Infrastructure";
      case "waste":
        return "BBMP Solid Waste Management";
      case "drainage":
        return "BBMP Stormwater Drains (SWD)";
      case "electricity":
        return "BESCOM Electrical Operations";
      case "water":
        return "BWSSB Water Supply & Sewerage";
      default:
        return id.toUpperCase();
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Authority Profile &amp; Settings"
        description="Municipal staff credentials, departmental jurisdiction, and operational alerts."
        meta={<DemoBadge />}
      />

      <div className="flex flex-col gap-8 max-w-2xl">
        <div className="rounded-md border border-border bg-surface p-6 shadow-xs">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted">
              <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="flex flex-col gap-6">
              {statusMsg && (
                <div
                  className={`flex items-center gap-2 rounded-md p-3 text-sm ${
                    statusMsg.type === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border border-red-200 bg-red-50 text-red-800"
                  }`}
                  role="status"
                >
                  {statusMsg.type === "success" && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  )}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              {/* Department Jurisdiction Card */}
              <div className="flex flex-col gap-2 rounded-md border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                  <span>Assigned Departmental Jurisdiction</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-base font-bold text-ink">
                    {getDepartmentLabel(departmentId)}
                  </span>
                  <span className="rounded bg-primary px-2 py-0.5 text-xs font-mono font-semibold text-white">
                    ROLE: AUTHORITY
                  </span>
                </div>
                <p className="text-xs text-muted">
                  Authorised to inspect, prioritize, reassign, and resolve issues within your department.
                </p>
              </div>

              {/* Official Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Official Email
                </label>
                <div className="flex items-center gap-2 rounded-md border border-border bg-surface-muted px-3.5 py-2.5 text-sm text-ink">
                  <Mail className="h-4 w-4 text-muted" aria-hidden="true" />
                  <span className="font-mono text-xs">{email}</span>
                </div>
              </div>

              {/* Officer Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="auth-name" className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Officer Display Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                />
              </div>

              {/* Notification Toggles */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-2 border-b border-border pb-2 text-sm font-semibold text-ink">
                  <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>Dispatch &amp; SLA Alerts</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <label htmlFor="notify-queue" className="flex flex-col gap-0.5 pr-4 cursor-pointer">
                    <span className="text-sm font-medium text-ink">New complaints in department queue</span>
                    <span className="text-xs text-muted">
                      Alerts when citizen reports in your category pass AI validation.
                    </span>
                  </label>
                  <input
                    id="notify-queue"
                    aria-label="New complaints in department queue"
                    type="checkbox"
                    checked={notifyQueue}
                    onChange={(e) => setNotifyQueue(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <label htmlFor="notify-sla" className="flex flex-col gap-0.5 pr-4 cursor-pointer">
                    <span className="text-sm font-medium text-ink">SLA breach warnings</span>
                    <span className="text-xs text-muted">
                      Immediate alert when an open issue enters the final 4 hours of its SLA window.
                    </span>
                  </label>
                  <input
                    id="notify-sla"
                    aria-label="SLA breach warnings"
                    type="checkbox"
                    checked={notifySla}
                    onChange={(e) => setNotifySla(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary cursor-pointer"
                  />
                </div>
              </div>

              {/* Administrative note */}
              <div className="flex items-start gap-2.5 rounded-md border border-border bg-surface-muted p-3.5 text-xs text-muted">
                <Info className="h-4 w-4 shrink-0 text-muted mt-0.5" aria-hidden="true" />
                <span>
                  Role accounts are managed by municipal administration. Contact your city administrator to transfer departments or deactivate this profile.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" aria-hidden="true" />
                      <span>Save changes</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
