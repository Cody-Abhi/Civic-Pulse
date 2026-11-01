"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";

interface QueueCardListProps<T> {
  rows: T[];
  keyFn: (row: T) => string;
  renderCard: (row: T) => ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function QueueCardList<T>({
  rows,
  keyFn,
  renderCard,
  loading = false,
  error,
  onRetry,
  emptyTitle = "No records found",
  emptyDescription,
  className,
}: QueueCardListProps<T>) {
  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 rounded-md bg-sunken skeleton-shimmer-light" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {rows.map((row) => (
        <div key={keyFn(row)}>{renderCard(row)}</div>
      ))}
    </div>
  );
}
