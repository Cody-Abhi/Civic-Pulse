"use client";

import { cn } from "@/lib/cn";

interface CivicPulseLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  showTagline?: boolean;
}

/**
 * CivicPulse brand mark — civic pulse waveform + connected city signal.
 * Lightweight inline SVG; no external assets.
 */
export function CivicPulseLogo({
  className,
  size = "md",
  variant = "light",
  showTagline = false,
}: CivicPulseLogoProps) {
  const sizes = { sm: 28, md: 36, lg: 48 };
  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={s}
        height={s}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* City buildings silhouette */}
        <rect x="8" y="20" width="6" height="20" rx="1" fill="var(--cp-auth-accent)" opacity="0.7" />
        <rect x="16" y="12" width="6" height="28" rx="1" fill="var(--cp-auth-accent)" opacity="0.85" />
        <rect x="24" y="16" width="6" height="24" rx="1" fill="var(--cp-auth-accent)" />
        <rect x="32" y="22" width="6" height="18" rx="1" fill="var(--cp-auth-accent)" opacity="0.7" />
        {/* Pulse waveform */}
        <path
          d="M4 28 L12 28 L16 18 L22 34 L28 14 L34 30 L38 24 L44 24"
          stroke="var(--cp-auth-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Signal dot */}
        <circle cx="24" cy="8" r="3" fill="var(--cp-auth-accent)" />
        <circle cx="24" cy="8" r="5" stroke="var(--cp-auth-accent)" strokeWidth="1" opacity="0.4" />
        <circle cx="24" cy="8" r="7" stroke="var(--cp-auth-accent)" strokeWidth="0.5" opacity="0.2" />
      </svg>
      <div className="flex flex-col">
        <span
          className="text-lg font-bold leading-tight tracking-[-0.01em]"
          style={{ color: variant === "light" ? "var(--cp-auth-text-white)" : "var(--cp-text)" }}
        >
          CivicPulse
        </span>
        {showTagline && (
          <span
            className="text-[11px] font-medium leading-tight tracking-wide"
            style={{ color: variant === "light" ? "var(--cp-auth-text-white-70)" : "var(--cp-auth-text-slate)" }}
          >
            Smart City. Better Tomorrow.
          </span>
        )}
      </div>
    </div>
  );
}
