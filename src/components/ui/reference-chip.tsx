"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

export interface ReferenceChipProps {
  reference: string;
  copyable?: boolean;
  className?: string;
  size?: "sm" | "md";
}

/**
 * ReferenceChip (§17.1)
 * Standard monospace civic complaint reference code with one-tap copy feedback.
 * e.g. "CP-BLR-2611-000124"
 */
export function ReferenceChip({
  reference,
  copyable = true,
  className,
  size = "md",
}: ReferenceChipProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!copyable || copied) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(reference);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // Fallback: silent failure on clipboard denial
    }
  }, [reference, copyable, copied]);

  const Comp = copyable ? "button" : "span";

  return (
    <Comp
      type={copyable ? "button" : undefined}
      onClick={copyable ? handleCopy : undefined}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-xs border border-border bg-sunken font-mono font-medium text-ink transition-colors",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs",
        copyable && "cursor-pointer hover:border-primary/40 hover:bg-surface active:scale-[0.98]",
        className,
      )}
      title={copyable ? (copied ? "Copied!" : "Click to copy reference") : undefined}
      aria-label={copyable ? `Copy reference code ${reference}` : undefined}
    >
      <span className="tracking-tight">{reference}</span>
      {copyable && (
        <span className="text-muted transition-colors group-hover:text-primary" aria-hidden="true">
          {copied ? (
            <Icon icon={Check} size={size === "sm" ? 12 : 14} className="text-success" />
          ) : (
            <Icon icon={Copy} size={size === "sm" ? 12 : 14} />
          )}
        </span>
      )}
      {copied && <span className="sr-only">Copied reference to clipboard</span>}
    </Comp>
  );
}
