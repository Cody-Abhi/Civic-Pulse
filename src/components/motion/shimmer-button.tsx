"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ShimmerButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function ShimmerButton({
  children,
  className,
  onClick,
  type = "button",
  disabled = false,
}: ShimmerButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "shimmer-btn group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-lg px-6 font-semibold text-on-primary transition-all duration-300 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      <span className="shimmer-btn-bg absolute inset-0 bg-primary" />
      <span className="shimmer-btn-shine absolute inset-0" />
      <span className="shimmer-btn-glow absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
