"use client";

import * as React from "react";
import { AlertTriangle, Power } from "lucide-react";
import { MetricStrip, type MetricStripItem } from "@/components/data/metric-strip";
import { ChartFrame } from "@/components/data/chart-frame";
import { Button } from "@/components/ui/button";
import { ViewOnlyGuard } from "@/components/ui/view-only-guard";

interface AiMetrics {
  paused: boolean;
  dailyBudget: number;
  totalRequestsToday: number;
  fallbackRate24h: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  tokensTotalToday: number;
  recentCalls: Array<{
    id: string;
    timestamp: string;
    model: string;
    category: string;
    latencyMs: number;
    tokens: number;
    source: string;
    status: string;
    reason?: string;
  }>;
}

interface AiMonitoringClientProps {
  initialMetrics: AiMetrics;
}

export function AiMonitoringClient({ initialMetrics }: AiMonitoringClientProps) {
  const [metrics, setMetrics] = React.useState<AiMetrics>(initialMetrics);
  const [isToggling, setIsToggling] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  const handleTogglePause = async () => {
    setIsToggling(true);
    setStatusMessage(null);

    const target = !metrics.paused;

    try {
      const res = await fetch("/api/admin/ai/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: target }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update AI safety state");
      }

      setMetrics((prev) => ({ ...prev, paused: data.paused }));
      setStatusMessage(
        data.paused
          ? "AI processing paused. System has engaged the deterministic keyword classifier fallback."
          : "AI processing resumed. Gemini 2.5 Flash active for automatic triage.",
      );
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsToggling(false);
    }
  };

  const metricItems: MetricStripItem[] = [
    {
      label: "Requests today / budget",
      value: `${metrics.totalRequestsToday} / ${metrics.dailyBudget}`,
      hint: `${Math.round((metrics.totalRequestsToday / metrics.dailyBudget) * 100)}% consumed`,
    },
    {
      label: "Fallback rate (24h)",
      value: `${metrics.fallbackRate24h}%`,
      hint: "Target < 5.0%",
      delta: { value: "Reliable", isPositive: true },
    },
    {
      label: "P50 inference latency",
      value: `${metrics.latencyP50Ms} ms`,
      hint: "Fast client feedback",
    },
    {
      label: "Tokens consumed today",
      value: metrics.tokensTotalToday,
      hint: "Gemini 2.5 Flash",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Safety Switch Banner */}
      <div
        className={`flex flex-col gap-4 rounded-xl border p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between ${
          metrics.paused
            ? "border-amber-300 bg-amber-50"
            : "border-border bg-surface-card"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              metrics.paused ? "bg-amber-100 text-amber-800" : "bg-primary/10 text-primary"
            }`}
          >
            {metrics.paused ? <AlertTriangle className="h-5 w-5" /> : <Power className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Emergency AI Safety Switch: {metrics.paused ? "PAUSED" : "OPERATIONAL"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {metrics.paused
                ? "Automatic Gemini calls are suspended. The platform is using local keyword-based heuristic classification."
                : "Automatic Gemini analysis is actively triaging new incoming citizen complaints."}
            </p>
          </div>
        </div>

        <ViewOnlyGuard tooltip="View-only demo account: AI pipeline controls disabled.">
          <Button
            variant={metrics.paused ? "primary" : "outline"}
            disabled={isToggling}
            onClick={handleTogglePause}
            className="shrink-0"
          >
            {isToggling
              ? "Switching..."
              : metrics.paused
                ? "Resume Gemini AI"
                : "Pause Gemini AI"}
          </Button>
        </ViewOnlyGuard>
      </div>

      {statusMessage && (
        <div className="rounded-lg bg-surface-card p-3 text-xs font-medium text-foreground border border-border">
          {statusMessage}
        </div>
      )}

      {/* Metric Strip */}
      <MetricStrip items={metricItems} />

      {/* Latency & Telemetry Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <ChartFrame
            title="Inference latency distribution"
            description="Percentile breakdown for server-side Gemini 2.5 Flash calls"
            table={{
              columns: ["Percentile", "Latency"],
              rows: [
                ["P50 (Median)", `${metrics.latencyP50Ms} ms`],
                ["P95", `${metrics.latencyP95Ms} ms`],
                ["Keyword Fallback", "12 ms"],
              ],
            }}
          >
            <div className="space-y-4 pt-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">P50 (Median)</span>
                  <span className="font-mono text-muted-foreground">{metrics.latencyP50Ms} ms</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${(metrics.latencyP50Ms / 2000) * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">P95 (95th percentile)</span>
                  <span className="font-mono text-muted-foreground">{metrics.latencyP95Ms} ms</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${(metrics.latencyP95Ms / 2000) * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">Keyword Fallback Latency</span>
                  <span className="font-mono text-muted-foreground">12 ms</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-teal-400" style={{ width: "2%" }} />
                </div>
              </div>
            </div>
          </ChartFrame>
        </div>

        <div className="lg:col-span-6">
          <ChartFrame
            title="Model availability & fallback reasons"
            description="24-hour error distribution and safe fallback activations"
            table={{
              columns: ["Reason", "Rate"],
              rows: [
                ["Successful Gemini", "96.2%"],
                ["Simulated timeout", "2.4%"],
                ["Rate limit backoff", "1.1%"],
              ],
            }}
          >
            <div className="flex h-44 flex-col justify-center space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Successful Gemini responses</span>
                <span className="font-mono font-semibold text-emerald-700">96.2%</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Simulated latency timeouts</span>
                <span className="font-mono font-semibold text-amber-700">2.4%</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Rate limit / Quota backoff</span>
                <span className="font-mono font-semibold text-muted-foreground">1.1%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Keyword classifier resilience</span>
                <span className="font-mono font-semibold text-primary">100% successful</span>
              </div>
            </div>
          </ChartFrame>
        </div>
      </div>

      {/* Recent Calls Log */}
      <div className="rounded-xl border border-border bg-surface-card p-5 shadow-xs">
        <h2 className="mb-3 text-base font-semibold text-foreground">Recent inference log</h2>
        <div className="overflow-x-auto focus:outline-none focus:ring-1 focus:ring-primary rounded-md" tabIndex={0} role="region" aria-label="Recent AI inference log table">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-medium text-muted-foreground">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Model / Pipeline</th>
                <th className="pb-3">Inferred Category</th>
                <th className="pb-3 text-right">Latency</th>
                <th className="pb-3 text-right">Tokens</th>
                <th className="pb-3 text-right">Pipeline Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {metrics.recentCalls.map((call) => (
                <tr key={call.id} className="hover:bg-muted/40">
                  <td className="py-2.5 font-mono text-xs text-muted-foreground">
                    {new Date(call.timestamp).toLocaleTimeString("en-IN")}
                  </td>
                  <td className="py-2.5 font-mono text-xs font-medium text-foreground">
                    {call.model}
                  </td>
                  <td className="py-2.5 text-xs capitalize text-foreground">
                    {call.category.toLowerCase()}
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs">{call.latencyMs} ms</td>
                  <td className="py-2.5 text-right font-mono text-xs">{call.tokens}</td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                        call.source === "gemini"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {call.source === "gemini" ? "Gemini 2.5 Flash" : "Keyword Fallback"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
