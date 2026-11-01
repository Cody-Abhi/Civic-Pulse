"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Shield,
  Download,
  Trash2,
  Lock,
  CheckCircle2,
  Loader2,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoBadge } from "@/components/ui/demo-badge";
import { Button } from "@/components/ui/button";

export default function CitizenSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [statusMsg, setStatusMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Preference state
  const [notifySupport, setNotifySupport] = React.useState(true);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = React.useState(false);
  const [defaultVisibility, setDefaultVisibility] = React.useState<"public" | "private">("public");

  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.prefs) {
          if (d.user.prefs.notifySupportAdded !== undefined) setNotifySupport(d.user.prefs.notifySupportAdded);
          if (d.user.prefs.notifyWeeklyDigest !== undefined) setNotifyWeeklyDigest(d.user.prefs.notifyWeeklyDigest);
          if (d.user.prefs.defaultVisibility) setDefaultVisibility(d.user.prefs.defaultVisibility);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSavePreferences = async () => {
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefs: {
            notifyStatusChanges: true, // locked
            notifySupportAdded: notifySupport,
            notifyWeeklyDigest,
            defaultVisibility,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      setStatusMsg({ type: "success", text: "Settings saved successfully." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error saving settings";
      setStatusMsg({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/me/export");
      if (!res.ok) throw new Error("Failed to export data");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `civicpulse-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Failed to export your data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);

    try {
      const res = await fetch("/api/me", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");

      // Logout and redirect
      await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
      router.replace("/login");
    } catch (err) {
      console.error(err);
      alert("Failed to delete account. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Settings"
        description="Configure notification channels, default privacy visibility, and GDPR data portability."
        meta={<DemoBadge />}
      />

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

      {loading ? (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        </div>
      ) : (
        <div className="flex flex-col gap-8 max-w-3xl">
        {/* Section 1: Notifications */}
        <section className="rounded-md border border-border bg-surface p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-semibold text-ink">Notification Preferences</h2>
          </div>

          <div className="flex flex-col divide-y divide-border">
            {/* Status Changes (Locked ON) */}
            <div className="flex items-center justify-between py-3.5">
              <label htmlFor="notify-status" className="flex flex-col gap-0.5 pr-4 cursor-pointer">
                <span className="text-sm font-medium text-ink flex items-center gap-1.5">
                  <span>Status and resolution updates</span>
                  <Lock className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                </span>
                <span className="text-xs text-muted">
                  Required to notify you when BBMP crews inspect, resolve, or request details on your report.
                </span>
              </label>
              <input
                id="notify-status"
                type="checkbox"
                checked={true}
                disabled
                aria-label="Status updates (locked on)"
                className="h-4 w-4 rounded border-border text-primary cursor-not-allowed opacity-75"
              />
            </div>

            {/* Support added */}
            <div className="flex items-center justify-between py-3.5">
              <label htmlFor="notify-support" className="flex flex-col gap-0.5 pr-4 cursor-pointer">
                <span className="text-sm font-medium text-ink">Neighbor support alerts</span>
                <span className="text-xs text-muted">
                  Receive notifications when neighboring residents add their voice to support your complaint.
                </span>
              </label>
              <input
                type="checkbox"
                id="notify-support"
                aria-label="Neighbor support alerts"
                checked={notifySupport}
                onChange={(e) => setNotifySupport(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary cursor-pointer"
              />
            </div>

            {/* Weekly Ward Digest */}
            <div className="flex items-center justify-between py-3.5">
              <label htmlFor="notify-digest" className="flex flex-col gap-0.5 pr-4 cursor-pointer">
                <span className="text-sm font-medium text-ink">Weekly ward activity digest</span>
                <span className="text-xs text-muted">
                  A weekly summary of resolution rates and top civic repairs in your home ward.
                </span>
              </label>
              <input
                type="checkbox"
                id="notify-digest"
                aria-label="Weekly ward activity digest"
                checked={notifyWeeklyDigest}
                onChange={(e) => setNotifyWeeklyDigest(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={handleSavePreferences} disabled={saving}>
              {saving ? "Saving..." : "Save preferences"}
            </Button>
          </div>
        </section>

        {/* Section 2: Privacy Preferences */}
        <section className="rounded-md border border-border bg-surface p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Eye className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-semibold text-ink">Privacy &amp; Visibility</h2>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-ink">Default Report Visibility</label>
            <p className="text-xs text-muted leading-relaxed">
              Public reports appear on the open city map and allow neighbors to add their voice, speeding up municipal response. Private reports are strictly visible to you and assigned municipal officers. Personal data (phone, name, email) is always redacted.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label
                className={`flex items-start gap-3 rounded-md border p-3.5 cursor-pointer transition-colors ${
                  defaultVisibility === "public"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-surface-muted"
                }`}
              >
                <input
                  type="radio"
                  id="visibility-public"
                  name="visibility"
                  value="public"
                  aria-label="Public visibility"
                  checked={defaultVisibility === "public"}
                  onChange={() => setDefaultVisibility("public")}
                  className="mt-0.5 text-primary"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-ink">Public (Recommended)</span>
                  <span className="text-xs text-muted">Visible on open city map with community support</span>
                </div>
              </label>

              <label
                htmlFor="visibility-private"
                className={`flex items-start gap-3 rounded-md border p-3.5 cursor-pointer transition-colors ${
                  defaultVisibility === "private"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-surface-muted"
                }`}
              >
                <input
                  type="radio"
                  id="visibility-private"
                  name="visibility"
                  value="private"
                  aria-label="Private visibility"
                  checked={defaultVisibility === "private"}
                  onChange={() => setDefaultVisibility("private")}
                  className="mt-0.5 text-primary"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-ink">Private</span>
                  <span className="text-xs text-muted">Only visible to reporter and assigned authorities</span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={handleSavePreferences} disabled={saving}>
              {saving ? "Saving..." : "Save privacy settings"}
            </Button>
          </div>
        </section>

        {/* Section 3: Data Portability & Account Deletion */}
        <section className="rounded-md border border-border bg-surface p-6 shadow-xs flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-semibold text-ink">Data Management &amp; Deletion</h2>
          </div>

          {/* Download Data */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-ink">Download your data (GDPR Export)</span>
              <span className="text-xs text-muted">
                Export an archive containing your profile, submitted civic reports, and notifications in JSON format.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadData}
              disabled={exporting}
              className="gap-2 shrink-0"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>{exporting ? "Exporting..." : "Download JSON"}</span>
            </Button>
          </div>

          <hr className="border-border" />

          {/* Delete Account */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-semibold">Delete Account</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Permanently delete your profile and notifications. All civic complaint records you filed will be completely anonymised and disconnected from your identity to preserve municipal work history.
            </p>

            {!showDeleteDialog ? (
              <div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete my account
                </Button>
              </div>
            ) : (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 flex flex-col gap-3">
                <label htmlFor="delete-confirm-input" className="text-xs font-semibold text-red-800">
                  Are you sure? Type &quot;DELETE&quot; below to confirm:
                </label>
                <input
                  id="delete-confirm-input"
                  aria-label="Confirm account deletion by typing DELETE"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="rounded border border-red-300 bg-surface px-3 py-1.5 text-sm font-mono text-ink focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="flex gap-2 justify-end pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setDeleteConfirmText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteConfirmText !== "DELETE" || deleting}
                    onClick={handleDeleteAccount}
                  >
                    {deleting ? "Deleting..." : "Permanently Delete"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      )}
    </div>
  );
}
