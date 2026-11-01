"use client";

import * as React from "react";
import { Siren, TriangleAlert, CircleDot, CircleMinus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import { Badge, type BadgeProps } from "./badge";
import type { PriorityBand } from "@/domain/schemas";

export interface PriorityBadgeProps {
  band: PriorityBand;
  score?: number;
  variant?: "pill-with-score" | "label";
  size?: "sm" | "md";
  className?: string;
}

const PRIORITY_META: Record<
  PriorityBand,
  { variant: BadgeProps["variant"]; icon: LucideIcon; label: string }
> = {
  CRITICAL: { variant: "critical", icon: Siren, label: "Critical" },
  HIGH: { variant: "high", icon: TriangleAlert, label: "High" },
  MEDIUM: { variant: "medium", icon: CircleDot, label: "Medium" },
  LOW: { variant: "low", icon: CircleMinus, label: "Low" },
};

/**
 * PriorityBadge (§15.1, §17.1)
 * Always displays icon + label + semantic color (never color alone).
 * Supports optional score pill (e.g. "Critical · 74").
 */
export function PriorityBadge({
  band,
  score,
  variant = "pill-with-score",
  size = "md",
  className,
}: PriorityBadgeProps) {
  const meta = PRIORITY_META[band] ?? PRIORITY_META.LOW;

  return (
    <Badge
      variant={meta.variant}
      className={cn(
        "font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs",
        className,
      )}
    >
      <Icon icon={meta.icon} size={size === "sm" ? 13 : 15} />
      <span>{meta.label}</span>
      {variant === "pill-with-score" && typeof score === "number" && (
        <span
          className="ml-1 inline-flex items-center rounded-xs bg-black/10 px-1 py-0 font-mono text-[11px] font-semibold tracking-tight"
          aria-label={`Score: ${score}`}
        >
          {score}
        </span>
      )}
    </Badge>
  );
}

export { PRIORITY_META };
