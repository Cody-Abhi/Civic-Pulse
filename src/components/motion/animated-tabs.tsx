"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

interface Tab {
  id: string;
  label: string;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  activeId: string;
  onTabChange: (id: string) => void;
  className?: string;
  children?: ReactNode;
}

export function AnimatedTabs({
  tabs,
  activeId,
  onTabChange,
  className,
}: AnimatedTabsProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div className={cn("auth-tabs-bg flex gap-0 rounded-lg p-1", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex-1 rounded-md py-2 text-sm font-semibold transition-colors duration-200",
              isActive ? "text-on-primary" : "auth-text-slate hover:opacity-80",
            )}
          >
            {isActive && (
              prefersReduced ? (
                <span className="absolute inset-0 rounded-md bg-primary shadow-sm" />
              ) : (
                <motion.span
                  layoutId="auth-tab-indicator"
                  className="absolute inset-0 rounded-md bg-primary shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
