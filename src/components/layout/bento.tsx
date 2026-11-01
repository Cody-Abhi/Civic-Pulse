import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Bento grid for landing sections and overview metrics (§ design brief).
 * A 6-column responsive grid; children set their own col/row span via
 * `BentoItem` to create a deliberate, non-uniform rhythm.
 */
export function BentoGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6", className)}
      {...props}
    />
  );
}

const SPAN: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
};

export interface BentoItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Columns to span at lg (1–6). */
  span?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function BentoItem({ span = 2, className, ...props }: BentoItemProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-6 shadow-e1",
        SPAN[span],
        className,
      )}
      {...props}
    />
  );
}
