"use client";

import * as React from "react";
import {
  Inbox,
  Eye,
  UserCheck,
  Hammer,
  CircleCheck,
  Archive,
  CircleX,
  RotateCcw,
  Copy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import { Badge, type BadgeProps } from "./badge";
import type { ComplaintStatus } from "@/domain/schemas";

export interface StatusBadgeProps {
  status: ComplaintStatus | "DUPLICATE";
  size?: "sm" | "md";
  className?: string;
}

const STATUS_META: Record<
  ComplaintStatus | "DUPLICATE",
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
  DUPLICATE: { variant: "neutral", icon: Copy, label: "Linked duplicate" },
};

/**
 * StatusBadge (§15.1, §17.1)
 * Always displays icon + label + semantic color (never color alone).
 */
export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const meta = STATUS_META[status] ?? STATUS_META.SUBMITTED;

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
    </Badge>
  );
}

export { STATUS_META };
