import * as React from "react";
import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader (§17.1)
 * Enforces strict single H1 page hierarchy, capped prose (max 72ch),
 * and responsive action alignment.
 */
export function PageHeader({
  title,
  description,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 pb-6 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        {meta && <div className="flex items-center gap-2">{meta}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-[72ch] text-sm text-muted leading-relaxed md:text-base">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-2.5 pt-2 md:pt-0">
          {actions}
        </div>
      )}
    </header>
  );
}
