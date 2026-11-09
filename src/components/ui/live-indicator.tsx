"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface LiveIndicatorProps {
  isLive: boolean;
  className?: string;
  showText?: boolean;
}

/**
 * Subtle "Live" indicator for active Firestore onSnapshot listeners (PRD §23.4, Block C).
 * Shows a gentle pulsing emerald dot and optional text. Hidden when listener is inactive.
 */
export function LiveIndicator({
  isLive,
  className,
  showText = true,
}: LiveIndicatorProps) {
  if (!isLive) return null;

  return (
    <span
      role="status"
      aria-label="Real-time updates active"
      title="Connected to live real-time updates"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-50/80 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 select-none shadow-2xs",
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      {showText && <span className="font-semibold tracking-wide uppercase text-[10px]">Live</span>}
    </span>
  );
}
