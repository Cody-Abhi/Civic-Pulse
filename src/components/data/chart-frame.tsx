"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";

interface ChartFrameProps {
  title: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function ChartFrame({
  title,
  description,
  loading = false,
  error,
  empty = false,
  emptyMessage = "No data available yet",
  onRetry,
  children,
  className,
  actions,
}: ChartFrameProps) {
  return (
    <section
      className={cn(
        "rounded-md border border-border bg-surface",
        className,
      )}
    >
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-1.5">{actions}</div>}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-48 w-full rounded-sm bg-sunken skeleton-shimmer-light" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} className="py-8" />
        ) : empty ? (
          <EmptyState title={emptyMessage} className="py-8" />
        ) : (
          children
        )}
      </div>
    </section>
  );
}
