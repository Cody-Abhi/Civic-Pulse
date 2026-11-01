"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriorityReceipt } from "@/components/ai/priority-receipt";
import type { SystemSettings, Weights, PriorityResult } from "@/domain/types";

interface SettingsClientProps {
  initialSettings: SystemSettings;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [, setSettings] = React.useState<SystemSettings>(initialSettings);
  const [weights, setWeights] = React.useState<Weights>(initialSettings.weights);
  const [dupRadius, setDupRadius] = React.useState(initialSettings.duplicates.radiusM);
  const [dupWindow, setDupWindow] = React.useState(initialSettings.duplicates.windowDays);
  const [aiBudget, setAiBudget] = React.useState(initialSettings.ai.dailyBudget);
  const [userLimit, setUserLimit] = React.useState(initialSettings.ai.userDailyLimit);

  // Demo Reset Modal State
  const [isResetOpen, setIsResetOpen] = React.useState(false);
  const [resetConfirmText, setResetConfirmText] = React.useState("");
  const [isResetting, setIsResetting] = React.useState(false);

  const [savingSection, setSavingSection] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  // Live sum of weights
  const weightsSum = React.useMemo(() => {
    const sum = Object.values(weights).reduce((acc, val) => acc + Number(val || 0), 0);
    return Math.round(sum * 1000) / 1000;
  }, [weights]);

  const isWeightsValid = Math.abs(weightsSum - 1.0) <= 0.002;

  // Sample Receipt Preview
  const samplePriority: PriorityResult = React.useMemo(() => {
    return {
      score: 78,
      band: "CRITICAL",
      base: 45,
      adjustment: 0,
      factors: {
        S: 25,
        H: 20,
        R: 15,
        D: 10,
        A: 8,
        G: 0,
        T: 0,
      },
      lineItems: [
        {
          key: "S",
          label: "Safety hazard",
          detail: "Critical severity",
          factor: 1.0,
          weight: weights.S,
          points: Math.round(weights.S * 100),
        },
        {
          key: "H",
          label: "Vulnerability context",
          detail: "Near school",
          factor: 0.8,
          weight: weights.H,
          points: Math.round(weights.H * 80),
        },
        {
          key: "R",
          label: "Independent reports (3)",
          detail: "3 distinct citizens",
          factor: 0.6,
          weight: weights.R,
          points: Math.round(weights.R * 60),
        },
        {
          key: "D",
          label: "Duration in queue (5d)",
          detail: "5 days elapsed",
          factor: 0.7,
          weight: weights.D,
          points: Math.round(weights.D * 70),
        },
        {
          key: "A",
          label: "Affected scale",
          detail: "Local ward area",
          factor: 0.6,
          weight: weights.A,
          points: Math.round(weights.A * 60),
        },
      ],
      weightsVersion: 3,
      computedAt: new Date().toISOString(),
      provisional: false,
    };
  }, [weights]);

  const handleSaveWeights = async () => {
    if (!isWeightsValid) return;
    setSavingSection("weights");
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "weights", values: weights }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save weights");

      setSettings((prev) => ({ ...prev, weights: data.settings.weights }));
      setFeedback({ type: "success", message: "Priority factor weights updated and applied." });
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : String(err) });
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveDuplicates = async () => {
    setSavingSection("duplicates");
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "duplicates",
          values: { radiusM: dupRadius, windowDays: dupWindow },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save duplicate settings");

      setSettings((prev) => ({ ...prev, duplicates: data.settings.duplicates }));
      setFeedback({ type: "success", message: "Duplicate detection thresholds updated." });
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : String(err) });
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveAi = async () => {
    setSavingSection("ai");
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "ai",
          values: { dailyBudget: aiBudget, userDailyLimit: userLimit },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save AI configuration");

      setSettings((prev) => ({ ...prev, ai: data.settings.ai }));
      setFeedback({ type: "success", message: "AI rate caps and budget updated." });
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : String(err) });
    } finally {
      setSavingSection(null);
    }
  };

  const handleTriggerDemoReset = async () => {
    if (resetConfirmText !== "RESET DEMO") return;
    setIsResetting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/demo/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Demo reset failed");

      setFeedback({
        type: "success",
        message: `Synthetic data reset successful: ${data.seededCount} complaints re-seeded.`,
      });
      setIsResetOpen(false);
      setResetConfirmText("");
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Panel 1: Priority Weights & Live Receipt Preview */}
      <div className="rounded-xl border border-border bg-surface-card p-6 shadow-xs">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-foreground">Priority factor weights</h2>
            <p className="text-xs text-muted-foreground">
              Define transparent weights across 7 deterministic priority dimensions. Total sum must equal exactly 1.00.
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-semibold ${
              isWeightsValid ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
            }`}
          >
            Sum: {weightsSum.toFixed(2)} / 1.00 {isWeightsValid ? "✓" : "(!)"}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Inputs (7 cols) */}
          <div className="space-y-3 lg:col-span-7">
            {[
              { key: "S", label: "S - Safety hazard severity" },
              { key: "H", label: "H - Vulnerability context" },
              { key: "R", label: "R - Independent reporter count" },
              { key: "D", label: "D - Duration waiting in queue" },
              { key: "A", label: "A - Affected scale / zone" },
              { key: "G", label: "G - Geographic density & proximity" },
              { key: "T", label: "T - Monsoon time-sensitivity" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-4 text-xs">
                <label htmlFor={`weight-${key}`} className="font-medium text-foreground">
                  {label}
                </label>
                <input
                  id={`weight-${key}`}
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={weights[key as keyof Weights]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setWeights((prev) => ({ ...prev, [key]: val }));
                  }}
                  className="w-24 rounded-md border border-border bg-surface px-2.5 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}

            {!isWeightsValid && (
              <p className="text-xs text-rose-600">
                Weights must add up to 1.00 (currently {weightsSum.toFixed(2)}). Adjust values to enable saving.
              </p>
            )}

            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                disabled={!isWeightsValid || savingSection === "weights"}
                onClick={handleSaveWeights}
              >
                {savingSection === "weights" ? "Saving..." : "Save factor weights"}
              </Button>
            </div>
          </div>

          {/* Live Receipt Preview (5 cols) */}
          <div className="lg:col-span-5">
            <span className="mb-2 block text-xs font-semibold text-muted-foreground uppercase">
              Preview Priority Receipt
            </span>
            <PriorityReceipt priority={samplePriority} reference="PREVIEW-001" variant="preview" />
          </div>
        </div>
      </div>

      {/* Panel 2 & 3: Duplicate Radar & AI Budgets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Duplicate Detection Settings */}
        <div className="rounded-xl border border-border bg-surface-card p-6 shadow-xs">
          <h2 className="mb-1 text-base font-semibold text-foreground">Duplicate radar settings</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Spatiotemporal thresholds for clustering similar community reports.
          </p>

          <div className="space-y-4 text-xs">
            <div>
              <label htmlFor="dup-radius-input" className="mb-1 block font-medium text-foreground">
                Cluster radius (metres: 50 – 1000m)
              </label>
              <input
                id="dup-radius-input"
                type="number"
                min="50"
                max="1000"
                step="50"
                value={dupRadius}
                onChange={(e) => setDupRadius(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
              />
            </div>

            <div>
              <label htmlFor="dup-window-input" className="mb-1 block font-medium text-foreground">
                Lookback window (days: 1 – 60d)
              </label>
              <input
                id="dup-window-input"
                type="number"
                min="1"
                max="60"
                value={dupWindow}
                onChange={(e) => setDupWindow(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={savingSection === "duplicates"}
              onClick={handleSaveDuplicates}
            >
              {savingSection === "duplicates" ? "Saving..." : "Update radar settings"}
            </Button>
          </div>
        </div>

        {/* AI & Rate Limits */}
        <div className="rounded-xl border border-border bg-surface-card p-6 shadow-xs">
          <h2 className="mb-1 text-base font-semibold text-foreground">AI limits & budgets</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Safety boundaries on Gemini API consumption and user rate limiting.
          </p>

          <div className="space-y-4 text-xs">
            <div>
              <label htmlFor="ai-budget-input" className="mb-1 block font-medium text-foreground">
                Daily Gemini inference quota (requests/day)
              </label>
              <input
                id="ai-budget-input"
                type="number"
                min="100"
                max="5000"
                step="50"
                value={aiBudget}
                onChange={(e) => setAiBudget(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
              />
            </div>

            <div>
              <label htmlFor="user-limit-input" className="mb-1 block font-medium text-foreground">
                Per-citizen daily analysis cap
              </label>
              <input
                id="user-limit-input"
                type="number"
                min="5"
                max="50"
                value={userLimit}
                onChange={(e) => setUserLimit(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-foreground"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={savingSection === "ai"}
              onClick={handleSaveAi}
            >
              {savingSection === "ai" ? "Saving..." : "Update AI limits"}
            </Button>
          </div>
        </div>
      </div>

      {/* Panel 4: Feature Flags (Read-only) */}
      <div className="rounded-xl border border-border bg-surface-card p-6 shadow-xs">
        <h2 className="mb-1 text-base font-semibold text-foreground">Platform feature flags</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          System capabilities defined in server environment configuration.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          {[
            { name: "FEATURE_UPLOADS", label: "Media attachments", status: "Active" },
            { name: "FEATURE_PUSH", label: "In-app notifications", status: "Active" },
            { name: "FEATURE_REVERSE_GEOCODE", label: "Map geocoding", status: "Active" },
            { name: "FEATURE_APP_CHECK", label: "API App Check", status: "Development" },
          ].map((f) => (
            <div key={f.name} className="rounded-lg border border-border bg-surface p-3">
              <div className="font-mono text-[11px] font-semibold text-foreground">{f.name}</div>
              <div className="mt-1 text-muted-foreground">{f.label}</div>
              <div className="mt-2">
                <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                  {f.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel 5: Demo Data Controls */}
      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Synthetic test data reset</h2>
            <p className="text-xs text-muted-foreground">
              Purges in-memory modifications and restores the canonical 240 synthetic complaints fixture corpus. Real test reports remain untouched.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-rose-300 text-rose-700 hover:bg-rose-100 shrink-0"
            onClick={() => setIsResetOpen(true)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset demo corpus
          </Button>
        </div>
      </div>

      {/* Demo Reset Modal */}
      {isResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface-card p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground">Confirm demo data reset</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              This action will reload all synthetic complaints, recalculate city metrics, and clear demo queue modifications. To proceed, please type <strong className="text-foreground">RESET DEMO</strong> below:
            </p>

            <div className="mt-4">
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="Type RESET DEMO"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsResetOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={resetConfirmText !== "RESET DEMO" || isResetting}
                onClick={handleTriggerDemoReset}
                className="bg-rose-700 hover:bg-rose-800"
              >
                {isResetting ? "Resetting..." : "Purge & re-seed"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
