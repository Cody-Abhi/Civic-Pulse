"use client";

import * as React from "react";
import { Receipt, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { priorityExplanation } from "@/domain/priority";
import type { PriorityResult } from "@/domain/types";

export interface PriorityReceiptProps {
  priority: PriorityResult;
  reference?: string;
  variant?: "full" | "mini" | "preview" | "public" | "example";
  showAdjustment?: boolean;
  provisional?: boolean;
  className?: string;
}

/**
 * PriorityReceipt (§29.5)
 * The signature design element of CivicPulse AI:
 * An itemised civic ledger card with a perforated top edge,
 * tabular numbers, and a deterministic 0–100 score breakdown.
 */
export function PriorityReceipt({
  priority,
  reference,
  variant = "full",
  showAdjustment = false,
  provisional = false,
  className,
}: PriorityReceiptProps) {
  const isMini = variant === "mini";
  const isProvisional = provisional || priority.provisional;
  const explanation = priorityExplanation(priority);

  // Format points with + sign and 1 decimal place
  const formatPoints = (pts: number) => {
    const formatted = Math.abs(pts).toFixed(1);
    if (pts > 0) return `+${formatted}`;
    if (pts < 0) return `-${formatted}`;
    return `+0.0`;
  };

  const lineItems = priority.lineItems.filter((item) => {
    if (item.key === "ADJ") {
      return showAdjustment && priority.adjustment !== 0;
    }
    return true;
  });

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-b-md border border-t-0 border-border bg-surface text-ink shadow-sm transition-all",
        className,
      )}
      style={{
        // Receipt perforated saw-tooth cut pattern at top
        backgroundImage: `radial-gradient(circle at 10px 0, transparent 0, transparent 4px, var(--cp-surface) 4.5px)`,
        backgroundSize: "20px 10px",
        backgroundRepeat: "repeat-x",
        paddingTop: "14px",
      }}
    >
      {/* Top perforated border line */}
      <div
        className="absolute left-0 right-0 top-0 h-1 border-b border-dashed border-border"
        aria-hidden="true"
      />

      <div className={cn("flex flex-col", isMini ? "p-3.5" : "p-5")}>
        {/* Receipt Header */}
        <div className="flex items-start justify-between gap-3 border-b border-dashed border-border pb-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider text-muted uppercase">
              <Icon icon={Receipt} size={14} className="text-primary" />
              <span>Priority Receipt</span>
              {isProvisional && (
                <span className="rounded-xs bg-warning-bg px-1.5 py-0 text-[10px] font-semibold text-warning">
                  Provisional
                </span>
              )}
            </div>
            <p className="text-xs text-muted">Deterministic 7-factor civic score</p>
          </div>
          {reference && (
            <span className="font-mono text-xs font-bold text-ink-secondary">
              {reference}
            </span>
          )}
        </div>

        {/* Line Items */}
        {!isMini && (
          <div className="flex flex-col divide-y divide-border/60 py-2.5">
            {lineItems.map((item) => {
              const isZero = Math.abs(item.points) < 0.05;
              return (
                <div
                  key={item.key}
                  className={cn(
                    "flex items-baseline justify-between py-1.5 text-xs",
                    isZero ? "text-muted opacity-75" : "text-ink",
                  )}
                >
                  <div className="flex flex-col pr-4">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-[11px] text-muted">{item.detail}</span>
                  </div>
                  <span
                    className={cn(
                      "font-mono font-semibold tabular-nums",
                      isZero ? "text-muted" : "text-primary",
                    )}
                  >
                    {formatPoints(item.points)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Total & Band */}
        <div className="flex items-center justify-between border-t border-dashed border-border pt-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-muted uppercase">
              Total Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold tracking-tight text-ink md:text-3xl">
                {priority.score}
              </span>
              <span className="text-xs text-muted">/ 100</span>
            </div>
          </div>
          <PriorityBadge band={priority.band} variant="pill-with-score" size="md" />
        </div>

        {/* One-line Plain-language Explanation (§29.5) */}
        <div className="mt-3 flex items-start gap-1.5 rounded-xs bg-sunken p-2.5 text-xs text-ink-secondary">
          <Icon icon={Info} size={15} className="mt-0.5 shrink-0 text-primary" />
          <p className="leading-relaxed">{explanation}</p>
        </div>

        {/* Footer Audit Guarantee */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <Icon icon={ShieldCheck} size={12} className="text-success" />
            Auditable rules v{priority.weightsVersion}
          </span>
          <span className="font-mono text-[10px]">AI advisory only</span>
        </div>
      </div>
    </div>
  );
}
