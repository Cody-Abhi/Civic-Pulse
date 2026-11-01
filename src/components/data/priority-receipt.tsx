import { cn } from "@/lib/cn";
import { PriorityBadge } from "@/components/ui/badge";
import type { PriorityResult } from "@/domain/types";

interface PriorityReceiptProps {
  priority: PriorityResult;
  className?: string;
  compact?: boolean;
}

export function PriorityReceipt({ priority, className, compact = false }: PriorityReceiptProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-surface",
        className,
      )}
    >
      {/* Perforated top edge */}
      <div
        className="h-3 w-full"
        style={{
          backgroundImage:
            "radial-gradient(circle at 8px 0, var(--cp-bg) 6px, transparent 6px)",
          backgroundSize: "16px 12px",
          backgroundPosition: "0 0",
          backgroundRepeat: "repeat-x",
          backgroundColor: "var(--cp-surface)",
        }}
        aria-hidden="true"
      />

      <div className={cn("px-4 pb-4", compact ? "pt-1" : "pt-2")}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            Priority receipt
          </span>
          <PriorityBadge band={priority.band} />
        </div>

        {/* Line items */}
        {!compact && (
          <table className="mt-3 w-full text-sm" aria-label="Priority factors">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="pb-1.5 font-medium">Factor</th>
                <th className="pb-1.5 text-right font-medium">Weight</th>
                <th className="pb-1.5 text-right font-medium">Score</th>
                <th className="pb-1.5 text-right font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {priority.lineItems.map((item) => (
                <tr key={item.key} className="border-b border-border/50">
                  <td className="py-1.5 text-ink">{item.label}</td>
                  <td className="py-1.5 text-right tabular-nums text-muted">
                    {(item.weight * 100).toFixed(0)}%
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-ink-secondary">
                    {item.factor.toFixed(1)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums font-medium text-ink">
                    {item.points.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Total */}
        <div className="mt-3 flex items-baseline justify-between border-t-2 border-ink pt-2">
          <span className="text-sm font-semibold uppercase tracking-wider text-ink">
            Total score
          </span>
          <span className="text-2xl font-bold tabular-nums text-ink">
            {priority.score.toFixed(1)}
          </span>
        </div>

        {priority.provisional && (
          <p className="mt-1.5 text-xs text-warning">
            Provisional — awaiting AI analysis
          </p>
        )}
      </div>
    </div>
  );
}
