import * as React from "react";
import {
  Siren,
  TriangleAlert,
  CircleDot,
  CircleMinus,
  Inbox,
  Eye,
  UserCheck,
  Hammer,
  CircleCheck,
  Archive,
  CircleX,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import type { PriorityBand, ComplaintStatus } from "@/domain/schemas";

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

const PRIORITY_META: Record<PriorityBand, { variant: BadgeProps["variant"]; icon: LucideIcon; label: string }> = {
  CRITICAL: { variant: "critical", icon: Siren, label: "Critical" },
  HIGH: { variant: "high", icon: TriangleAlert, label: "High" },
  MEDIUM: { variant: "medium", icon: CircleDot, label: "Medium" },
  LOW: { variant: "low", icon: CircleMinus, label: "Low" },
};

/** Priority badge — icon + label + colour (never colour-only, §15.1). */
export function PriorityBadge({ band, className }: { band: PriorityBand; className?: string }) {
  const meta = PRIORITY_META[band];
  return (
    <Badge variant={meta.variant} className={className}>
      <Icon icon={meta.icon} size={16} />
      {meta.label}
    </Badge>
  );
}

const STATUS_META: Record<
  ComplaintStatus,
  { variant: BadgeProps["variant"]; icon: LucideIcon; label: string }
> = {
  SUBMITTED: { variant: "neutral", icon: Inbox, label: "Submitted" },
  UNDER_REVIEW: { variant: "info", icon: Eye, label: "Under review" },
  ASSIGNED: { variant: "primary", icon: UserCheck, label: "Assigned" },
  IN_PROGRESS: { variant: "warning", icon: Hammer, label: "In progress" },
  RESOLVED: { variant: "success", icon: CircleCheck, label: "Resolved" },
  CLOSED: { variant: "neutral", icon: Archive, label: "Closed" },
  REJECTED: { variant: "danger", icon: CircleX, label: "Rejected" },
  REOPENED: { variant: "warning", icon: RotateCcw, label: "Reopened" },
};

/** Status badge — icon + label + colour. */
export function StatusBadge({ status, className }: { status: ComplaintStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <Badge variant={meta.variant} className={className}>
      <Icon icon={meta.icon} size={16} />
      {meta.label}
    </Badge>
  );
}

export { badgeVariants, PRIORITY_META, STATUS_META };
