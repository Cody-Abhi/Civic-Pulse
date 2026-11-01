"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ShinyTextProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function ShinyText({ children, className, style }: ShinyTextProps) {
  return (
    <span className={cn("shiny-text inline-block", className)} style={style}>
      {children}
    </span>
  );
}
