"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { MapSkeleton } from "./map-skeleton";

export function ComplaintDetailSkeleton({ className }: { className?: string }) {
  const prefersReduced = useReducedMotion();

  const staggerItem = (i: number) =>
    prefersReduced
      ? {}
      : {
          initial: { opacity: 0, y: 16 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.4, delay: i * 0.1, ease: [0.2, 0.8, 0.2, 1] as const },
        };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Back navigation */}
      <motion.div className="flex items-center gap-2 text-muted" {...staggerItem(0)}>
        <Icon icon={ArrowLeft} size={20} />
        <span className="text-sm font-medium">Back</span>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div className="flex flex-col gap-6">
          {/* Main card with pulsing loader */}
          <motion.div
            className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-10 shadow-e1"
            {...staggerItem(1)}
          >
            <div className="relative flex h-20 w-20 items-center justify-center">
              {!prefersReduced && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/20"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/5">
                <Loader2 size={28} className="animate-spin text-primary opacity-60" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-ink">Complaint Details Loading...</h2>
            <p className="text-sm text-muted">Fetching complaint information from the database</p>
          </motion.div>

          {/* Detail rows */}
          <motion.div
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-6 shadow-e1"
            {...staggerItem(2)}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton-shimmer-light h-4 w-28 rounded bg-sunken" />
                <div
                  className="skeleton-shimmer-light h-4 flex-1 rounded bg-sunken"
                  style={{ maxWidth: `${60 + (i % 3) * 15}%` }}
                />
              </div>
            ))}
          </motion.div>

          {/* Timeline */}
          <motion.div
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-6 shadow-e1"
            {...staggerItem(3)}
          >
            <div className="skeleton-shimmer-light h-5 w-24 rounded bg-sunken" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 pl-2">
                <div className="skeleton-shimmer-light mt-1 h-3 w-3 shrink-0 rounded-full bg-sunken" />
                <div className="flex flex-1 flex-col gap-1">
                  <div className="skeleton-shimmer-light h-4 w-48 rounded bg-sunken" />
                  <div className="skeleton-shimmer-light h-3 w-32 rounded bg-sunken" />
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-6">
          <motion.div {...staggerItem(2)}>
            <MapSkeleton className="h-[220px]" />
          </motion.div>

          <motion.div
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-e1"
            {...staggerItem(3)}
          >
            <div className="skeleton-shimmer-light h-4 w-20 rounded bg-sunken" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="skeleton-shimmer-light h-3 w-20 rounded bg-sunken" />
                <div className="skeleton-shimmer-light h-3 w-24 rounded bg-sunken" />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
