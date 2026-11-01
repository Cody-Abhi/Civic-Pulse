"use client";

import { cn } from "@/lib/cn";
import { type LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { FadeIn } from "@/components/motion/fade-in";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <FadeIn className={cn("flex flex-col items-center justify-center gap-4 py-16 text-center", className)}>
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/5">
          <Icon icon={icon} size={36} className="text-primary/40" />
        </div>
        <svg
          className="absolute -inset-4 text-primary/10"
          viewBox="0 0 100 100"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" strokeDasharray="6 4" />
        </svg>
      </div>
      <div className="flex max-w-xs flex-col gap-1.5">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="text-sm leading-relaxed text-muted">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </FadeIn>
  );
}
