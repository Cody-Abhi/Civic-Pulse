"use client";

import * as React from "react";
import { Sparkles, HelpCircle, ChevronDown, ChevronUp, Bot, Cpu } from "lucide-react";
import type { AIAnalysisOutput, ComplaintCategory } from "@/domain/schemas";
import { CATEGORY_CONFIG } from "@/domain/categories";

export interface AIAnalysisCardProps {
  analysis: AIAnalysisOutput;
  variant?: "compact" | "full" | undefined;
  source?: "gemini" | "fallback" | undefined;
  model?: string | undefined;
  latencyMs?: number | undefined;
  fallbackReason?: string | null | undefined;
  onConfirmCategory?: (() => void) | undefined;
  onChangeCategory?: ((category: ComplaintCategory) => void) | undefined;
  verifiedSeverity?: number | null | undefined;
  onSeverityChange?: ((severity: number) => void) | undefined;
  className?: string | undefined;
}

export function AIAnalysisCard({
  analysis,
  variant = "full",
  source = "gemini",
  model = "gemini-3.8-flash",
  latencyMs,
  fallbackReason,
  verifiedSeverity,
  onSeverityChange,
  className = "",
}: AIAnalysisCardProps) {
  const [showReasoning, setShowReasoning] = React.useState(false);

  const confidencePct = Math.round((analysis.confidence || 0.6) * 100);
  const confidenceLevel =
    analysis.confidence >= 0.8
      ? { label: `High confidence (${confidencePct}%)`, color: "text-emerald-700 bg-emerald-50 border-emerald-200" }
      : analysis.confidence >= 0.5
        ? { label: `Medium confidence (${confidencePct}%)`, color: "text-amber-700 bg-amber-50 border-amber-200" }
        : { label: `Low confidence (${confidencePct}%)`, color: "text-rose-700 bg-rose-50 border-rose-200" };

  const isFallback = source === "fallback";
  const catConfig = CATEGORY_CONFIG[analysis.predictedCategory as ComplaintCategory];

  return (
    <div
      className={`rounded-xl border border-primary/25 bg-primary/5 p-5 sm:p-6 flex flex-col gap-4 shadow-xs ${className}`}
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/15 pb-3">
        <div className="flex items-center gap-2">
          {isFallback ? (
            <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
          ) : (
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          )}
          <span className="font-semibold text-ink text-sm sm:text-base">
            {isFallback ? "Suggested by keyword match" : "AI suggestion"}
          </span>
          <span
            className="text-[11px] text-muted flex items-center gap-1 cursor-help"
            title="AI output is advisory and assists dispatchers. Final priority is transparent deterministic code."
          >
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Advisory triage</span>
          </span>
        </div>

        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${confidenceLevel.color}`}
        >
          {isFallback
            ? `Keyword fallback (${confidencePct}%)`
            : confidenceLevel.label}
        </span>
      </div>

      {/* Summary & Detected Issue */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
          Short Summary
        </span>
        <p className="text-sm font-medium text-ink leading-relaxed">
          {analysis.shortSummary}
        </p>
      </div>

      {/* Department & Category details */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted">Predicted category</span>
          <span className="text-sm font-semibold text-ink">
            {analysis.predictedCategory.replace(/_/g, " ")}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted">Assigned department</span>
          <span className="text-sm font-semibold text-ink uppercase">
            {analysis.recommendedDepartment || catConfig?.departmentId || "General"}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted">Suggested severity</span>
          <span className="text-sm font-semibold text-primary">
            Level {analysis.suggestedSeverity || catConfig?.baseSeverity || 3} of 5
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-muted">Standard SLA target</span>
          <span className="text-sm font-semibold text-ink">
            {catConfig?.slaHours || 48} hours
          </span>
        </div>
      </div>

      {/* Keywords Chips */}
      {analysis.extractedKeywords && analysis.extractedKeywords.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
            Extracted Keywords
          </span>
          <div className="flex flex-wrap gap-1.5">
            {analysis.extractedKeywords.map((kw, i) => (
              <span
                key={i}
                className="rounded-md border border-primary/20 bg-white/80 px-2 py-0.5 text-xs font-medium text-ink shadow-2xs"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible Reasoning */}
      {analysis.reasoning && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowReasoning(!showReasoning)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
            aria-expanded={showReasoning}
          >
            <span>{showReasoning ? "Hide classification reasoning" : "Why this suggestion?"}</span>
            {showReasoning ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
          {showReasoning && (
            <p className="mt-2 rounded-md border border-primary/20 bg-white/70 p-3 text-xs leading-relaxed text-ink-muted">
              {analysis.reasoning}
            </p>
          )}
        </div>
      )}

      {/* Verified Severity Control (if authority / admin) */}
      {variant === "full" && onSeverityChange && (
        <div className="border-t border-primary/15 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-xs font-semibold text-ink">
            Authority Verified Severity:
          </span>
          <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Verified severity">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onSeverityChange(lvl)}
                className={`h-7 w-7 rounded-md text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                  (verifiedSeverity ?? analysis.suggestedSeverity) === lvl
                    ? "bg-primary text-white shadow-xs"
                    : "bg-white text-ink border border-border hover:bg-canvas"
                }`}
                aria-checked={(verifiedSeverity ?? analysis.suggestedSeverity) === lvl}
                role="radio"
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footnote */}
      <div className="border-t border-primary/15 pt-2 flex flex-wrap items-center justify-between text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <Cpu className="h-3 w-3" aria-hidden="true" />
          <span>
            Model: {isFallback ? "deterministic keyword-classifier" : model}
            {latencyMs ? ` · ${latencyMs}ms` : ""}
            {fallbackReason ? ` · Fallback: ${fallbackReason}` : ""}
          </span>
        </span>
        <span>Independent prototype · AI is advisory only</span>
      </div>
    </div>
  );
}
