"use client";

import { motion, useReducedMotion } from "motion/react";
import { MetricCardSkeletonLight } from "./metric-card-skeleton";
import { ChartSkeleton } from "./chart-skeleton";
import { MapSkeleton } from "./map-skeleton";
import { cn } from "@/lib/cn";

export function DashboardSkeleton({ className }: { className?: string }) {
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
      {/* Page header */}
      <motion.div
        className="flex flex-col gap-1"
        {...staggerItem(0)}
      >
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-muted">Here&apos;s what&apos;s happening in your city today</p>
      </motion.div>

      {/* Metric cards — staggered entrance */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <motion.div key={i} {...staggerItem(i + 1)}>
            <MetricCardSkeletonLight />
          </motion.div>
        ))}
      </div>

      {/* Chart + Map row */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <motion.div {...staggerItem(5)}>
          <ChartSkeleton />
        </motion.div>
        <motion.div {...staggerItem(6)}>
          <MapSkeleton className="h-full min-h-[300px]" />
        </motion.div>
      </div>
    </div>
  );
}
