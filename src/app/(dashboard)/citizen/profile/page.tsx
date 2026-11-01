"use client";

import * as React from "react";
import { CheckCircle2, Mail, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoBadge } from "@/components/ui/demo-badge";
import { Button } from "@/components/ui/button";

const WARDS = [
  { id: "ward-150-bellandur", name: "150 - Bellandur" },
  { id: "ward-080-indiranagar", name: "080 - Indiranagar" },
  { id: "ward-151-koramangala", name: "151 - Koramangala" },
  { id: "ward-085-whitefield", name: "085 - Whitefield" },
  { id: "ward-174-hsr-layout", name: "174 - HSR Layout" },
  { id: "ward-045-malleshwaram", name: "045 - Malleshwaram" },
  { id: "ward-168-jayanagar", name: "168 - Jayanagar" },
  { id: "ward-007-hebbal", name: "007 - Hebbal" },
];

export default function CitizenProfilePage() {
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [homeWardId, setHomeWardId] = React.useState("ward-150-bellandur");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [statusMsg, setStatusMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) {
          setDisplayName(d.user.displayName || "");
          setEmail(d.user.email || "");
          if (d.user.homeWardId) setHomeWardId(d.user.homeWardId);
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
        body: JSON.stringify({ displayName, homeWardId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error?.message || "Failed to update profile");
      }

      setStatusMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error saving profile";
      setStatusMsg({ type: "error", text: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="My Profile"
        description="Manage your citizen identity, home ward, and municipal preferences."
        meta={<DemoBadge />}
      />

      <div className="w-full max-w-2xl rounded-md border border-border bg-surface p-6 shadow-xs">
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

            {/* Email Field (Read Only) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="profile-email" className="text-xs font-semibold uppercase tracking-wider text-muted">
                Email Address
              </label>
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface-muted px-3.5 py-2.5 text-sm text-ink">
                <Mail className="h-4 w-4 text-muted" aria-hidden="true" />
                <span className="flex-1 font-mono text-xs">{email}</span>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  Verified
                </span>
              </div>
              <p className="text-xs text-muted">
                Email is verified via Firebase Authentication and cannot be changed here.
              </p>
            </div>

            {/* Display Name Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="display-name" className="text-xs font-semibold uppercase tracking-wider text-muted">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="display-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Aarav Patel"
                  className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Home Ward Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="home-ward" className="text-xs font-semibold uppercase tracking-wider text-muted">
                Home Municipal Ward
              </label>
              <div className="relative">
                <select
                  id="home-ward"
                  value={homeWardId}
                  onChange={(e) => setHomeWardId(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none cursor-pointer"
                >
                  {WARDS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted">
                Used to default your incident location picker and prioritize local community alerts.
              </p>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end pt-2">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" aria-hidden="true" />
                    <span>Save profile changes</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
