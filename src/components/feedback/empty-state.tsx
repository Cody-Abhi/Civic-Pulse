"use client";

import { type LucideIcon, Inbox } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  icon?: LucideIcon | undefined;
  title: string;
  description?: string | undefined;
  action?: { label: string; onClick: () => void } | undefined;
  className?: string | undefined;
}

export function EmptyState({
  icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 py-12 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sunken">
        <Icon icon={icon} size={24} className="text-muted" />
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="max-w-[40ch] text-sm text-muted">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
