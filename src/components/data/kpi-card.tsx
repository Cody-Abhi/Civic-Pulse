"use client";

import { useRef, useState, type MouseEvent } from "react";
import { ArrowUpRight, ArrowDownRight, Minus, type LucideIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { formatMetric, formatDelta, type MetricUnit } from "@/lib/format";
import { Icon } from "@/components/ui/icon";
import { CountUp } from "@/components/motion/count-up";

export interface KpiDelta {
  value: number;
  direction: "up" | "down" | "flat";
  goodWhen: "up" | "down";
}

export interface KpiCardProps {
  label: string;
  value: number | null;
  unit?: MetricUnit;
  delta?: KpiDelta;
  icon?: LucideIcon;
  hint?: string;
  animate?: boolean;
  className?: string;
}

export function KpiCard({ label, value, unit, delta, icon, hint, animate = false, className }: KpiCardProps) {
  const good = delta ? delta.direction === delta.goodWhen : false;
  const deltaIcon =
    delta?.direction === "up" ? ArrowUpRight : delta?.direction === "down" ? ArrowDownRight : Minus;

  const ref = useRef<HTMLDivElement>(null);
  const [spotPos, setSpotPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const prefersReduced = useReducedMotion();

  const handleMouse = (e: MouseEvent<HTMLDivElement>) => {
    if (prefersReduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setSpotPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const decimals = unit === "percent" ? 1 : 0;
  const suffix = unit === "percent" ? "%" : unit === "hours" ? "h" : "";

  return (
    <div
      ref={ref}
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-md border border-border bg-surface p-5 shadow-e1",
        "transition-all duration-200 hover:shadow-e2 hover:border-primary/20",
        className,
      )}
      onMouseMove={handleMouse}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Spotlight gradient */}
      {!prefersReduced && hovering && (
        <div
          className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(300px circle at ${spotPos.x}px ${spotPos.y}px, var(--cp-primary-subtle), transparent 40%)`,
          }}
        />
      )}

      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="text-sm text-muted" title={hint}>
          {label}
        </span>
        {icon ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 transition-colors duration-200 group-hover:bg-primary/10">
            <Icon icon={icon} size={18} className="text-primary/60 transition-colors group-hover:text-primary" />
          </div>
        ) : null}
      </div>
      <div className="relative z-10 flex items-end justify-between gap-3">
        <span className="text-[32px] font-semibold leading-none tracking-[-0.01em] text-ink tabular-nums">
          {animate && value !== null ? (
            <CountUp to={value} decimals={decimals} suffix={suffix} />
          ) : (
            formatMetric(value, unit)
          )}
        </span>
        {delta && delta.direction !== "flat" ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-sm font-medium tabular-nums",
              good ? "text-success" : "text-danger",
            )}
          >
            <Icon icon={deltaIcon} size={16} />
            {formatDelta(delta.value, unit)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
