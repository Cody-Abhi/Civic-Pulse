"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface QueueCardListProps<Row extends { id: string }> {
  rows: Row[];
  renderCard: (row: Row) => React.ReactNode;
  onCardClick?: ((row: Row) => void) | undefined;
  className?: string | undefined;
}

/**
 * QueueCardList (§17.1, §17.2)
 * Mobile card list replacement for data tables below 768px.
 * Ensures touch-friendly layout without horizontal table clipping.
 */
export function QueueCardList<Row extends { id: string }>({
  rows,
  renderCard,
  onCardClick,
  className,
}: QueueCardListProps<Row>) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {rows.map((row) => (
        <div
          key={row.id}
          onClick={onCardClick ? () => onCardClick(row) : undefined}
          onKeyDown={
            onCardClick
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCardClick(row);
                  }
                }
              : undefined
          }
          role={onCardClick ? "button" : undefined}
          tabIndex={onCardClick ? 0 : undefined}
          className={cn(
            "rounded-md border border-border bg-surface p-4 text-ink shadow-xs transition-colors",
            onCardClick && "cursor-pointer hover:border-primary/40 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          )}
        >
          {renderCard(row)}
        </div>
      ))}
    </div>
  );
}
