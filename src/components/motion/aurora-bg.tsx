"use client";

import { cn } from "@/lib/cn";

interface AuroraBgProps {
  className?: string;
}

export function AuroraBg({ className }: AuroraBgProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
    </div>
  );
}
