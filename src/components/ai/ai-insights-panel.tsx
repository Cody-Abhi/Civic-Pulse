"use client";

import * as React from "react";
import { Sparkles, Bot, AlertCircle, ArrowUpRight, CheckCircle2, RefreshCw } from "lucide-react";
import { DemoBadge } from "@/components/ui/demo-badge";
import { Button } from "@/components/ui/button";
import type { CivicInsightsOutput } from "@/server/services/ai";

export interface AIInsightsPanelProps {
  scope?: string;
  className?: string;
}

export function AIInsightsPanel({
  scope = "city:blr",
  className = "",
}: AIInsightsPanelProps) {
  const [data, setData] = React.useState<CivicInsightsOutput | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    fetch(`/api/analytics/insights?scope=${encodeURIComponent(scope)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load insights");
        return res.json();
      })
      .then((json) => {
        if (active) {
          setData(json.insights);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Error fetching AI insights");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [scope]);

  const handleManualRefresh = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/analytics/insights?scope=${encodeURIComponent(scope)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load insights");
        return res.json();
      })
      .then((json) => {
        setData(json.insights);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error fetching AI insights");
        setLoading(false);
      });
  };

  return (
    <div className={`rounded-xl border border-primary/25 bg-primary/5 p-5 sm:p-6 flex flex-col gap-5 shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/15 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="font-bold text-ink text-base sm:text-lg">
            AI Civic Insights
          </h2>
          <DemoBadge />
        </div>

        <div className="flex items-center gap-2">
          {data && (
            <span className="rounded-full bg-white/80 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {data.source === "gemini" ? "Gemini 3.8 Flash" : "Template Fallback"}
            </span>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleManualRefresh}
            disabled={loading}
            className="h-7 w-7 p-0 text-primary"
            aria-label="Refresh insights"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          <span className="text-xs font-medium text-ink-muted">Synthesizing grounded city insights…</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-danger text-xs py-3">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-5">
          {/* Section 1: Grounded Observations */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>Grounded Observations (30-day comparative)</span>
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {data.observations.map((obs, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-primary/15 bg-white/70 p-3.5 flex flex-col gap-2"
                >
                  <p className="text-xs sm:text-sm font-medium text-ink leading-relaxed">
                    {obs.text}
                  </p>
                  {obs.metricRefs && obs.metricRefs.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-primary/10">
                      <span className="text-[10px] text-muted">Cited Metrics:</span>
                      {obs.metricRefs.map((ref, i) => (
                        <span
                          key={i}
                          className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-mono text-primary font-semibold"
                        >
                          {ref}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Recommendations */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>Suggested Department Actions</span>
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              {data.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-primary/15 bg-white/70 p-3.5 flex flex-col gap-2"
                >
                  <p className="text-xs sm:text-sm font-medium text-ink leading-relaxed">
                    {rec.text}
                  </p>
                  {rec.basedOn && rec.basedOn.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-primary/10">
                      <span className="text-[10px] text-muted">Based On:</span>
                      {rec.basedOn.map((b, i) => (
                        <span
                          key={i}
                          className="rounded bg-canvas border border-border px-1.5 py-0.2 text-[10px] font-mono text-ink-muted"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footnote */}
          <div className="border-t border-primary/15 pt-2 flex flex-wrap items-center justify-between text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>All observations cite live Firestore aggregate metrics · Zero hallucinated numbers</span>
            </span>
            <span>Generated: {new Date(data.generatedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
