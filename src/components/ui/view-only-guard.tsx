"use client";

import * as React from "react";
import { useViewOnly } from "@/components/auth/view-only-context";

interface ViewOnlyGuardProps {
  children: React.ReactNode;
  tooltip?: string;
  className?: string;
}

/**
 * View-Only Guard (PRD Block D §2).
 * Wraps mutating buttons in admin screens.
 * When in viewOnly demo mode, disables interactions and shows an informative tooltip.
 */
export function ViewOnlyGuard({
  children,
  tooltip = "View-only demo account: Mutations disabled for judges.",
  className = "",
}: ViewOnlyGuardProps) {
  const isViewOnly = useViewOnly();

  if (!isViewOnly) {
    return <>{children}</>;
  }

  return (
    <div
      className={`relative group inline-flex items-center ${className}`}
      title={tooltip}
      aria-disabled="true"
    >
      <div className="pointer-events-none opacity-60 cursor-not-allowed">
        {children}
      </div>
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-50 hidden group-hover:flex items-center gap-1.5 whitespace-nowrap rounded-md bg-ink px-2.5 py-1 text-xs text-white shadow-lg border border-border"
      >
        <span>👁️</span>
        <span>{tooltip}</span>
      </div>
    </div>
  );
}

