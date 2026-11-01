import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-xs px-2 py-0.5 text-xs font-medium leading-5",
  {
    variants: {
      variant: {
        neutral: "bg-sunken text-ink-secondary",
        primary: "bg-primary-subtle text-primary",
        success: "bg-success-bg text-success",
        warning: "bg-warning-bg text-warning",
        danger: "bg-danger-bg text-danger",
        info: "bg-info-bg text-info",
        demo: "bg-demo-bg text-demo-fg",
        ai: "bg-ai-bg text-ink-secondary",
        critical: "bg-prio-critical-bg text-prio-critical-fg",
        high: "bg-prio-high-bg text-prio-high-fg",
        medium: "bg-prio-medium-bg text-prio-medium-fg",
        low: "bg-prio-low-bg text-prio-low-fg",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
export { PriorityBadge, type PriorityBadgeProps, PRIORITY_META } from "./priority-badge";
export { StatusBadge, type StatusBadgeProps, STATUS_META } from "./status-badge";
