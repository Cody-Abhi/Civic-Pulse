import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

export interface DemoBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

/**
 * DemoBadge (§17.1)
 * Highlights synthetic prototype records to strictly prevent implying official government data.
 */
export function DemoBadge({ className, size = "md" }: DemoBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-xs bg-demo-bg font-medium text-demo-fg",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
        className,
      )}
      title="Synthetic demonstration record — not an official government record"
    >
      <Icon icon={Sparkles} size={size === "sm" ? 11 : 13} className="opacity-80" />
      <span>Demo data</span>
    </span>
  );
}
