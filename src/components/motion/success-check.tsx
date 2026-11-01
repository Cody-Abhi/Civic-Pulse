"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

interface SuccessCheckProps {
  className?: string;
  size?: number;
}

export function SuccessCheck({ className, size = 64 }: SuccessCheckProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        {/* Background circle */}
        <motion.circle
          cx="32"
          cy="32"
          r="28"
          fill="var(--cp-success-bg)"
          stroke="var(--cp-success)"
          strokeWidth="2"
          initial={prefersReduced ? {} : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        />
        {/* Checkmark */}
        <motion.path
          d="M20 33 L28 41 L44 25"
          stroke="var(--cp-success)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={prefersReduced ? {} : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        />
      </svg>
    </div>
  );
}
