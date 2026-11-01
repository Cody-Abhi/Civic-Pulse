"use client";

import { cn } from "@/lib/cn";

interface DotPatternProps {
  className?: string;
  glow?: boolean;
}

export function DotPattern({ className, glow = false }: DotPatternProps) {
  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="dot-grid"
          x="0"
          y="0"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r="1" fill="currentColor" />
        </pattern>
        {glow && (
          <radialGradient id="dot-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--cp-primary)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--cp-primary)" stopOpacity="0" />
          </radialGradient>
        )}
      </defs>
      <rect width="100%" height="100%" fill="url(#dot-grid)" opacity="0.3" />
      {glow && <rect width="100%" height="100%" fill="url(#dot-glow)" />}
    </svg>
  );
}
