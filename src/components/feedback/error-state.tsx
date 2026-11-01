import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  title: string;
  body?: string | undefined;
  onRetry?: (() => void) | undefined;
  digest?: string | undefined;
  variant?: "page" | "panel" | "inline" | undefined;
  className?: string | undefined;
}

/**
 * ErrorState (§17.1)
 * Accessible error presentation with optional retry action and error digest.
 */
export function ErrorState({
  title,
  body = "Something unexpected occurred while processing your request.",
  onRetry,
  digest,
  variant = "panel",
  className,
}: ErrorStateProps) {
  if (variant === "inline") {
    return (
      <div
        role="alert"
        className={cn(
          "flex items-center justify-between gap-3 rounded-xs border border-danger/30 bg-danger-bg p-3 text-xs text-danger",
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <Icon icon={AlertTriangle} size={16} className="shrink-0" />
          <span>{title}</span>
        </div>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="h-7 border-danger/40 bg-transparent text-xs text-danger hover:bg-danger/10"
          >
            <Icon icon={RefreshCw} size={12} />
            Retry
          </Button>
        )}
      </div>
    );
  }

  const isPage = variant === "page";

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isPage ? "min-h-[380px] p-8 md:p-12" : "rounded-md border border-border bg-surface p-6 md:p-8",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg text-danger">
        <Icon icon={AlertTriangle} size={24} />
      </div>

      <h3
        className={cn(
          "font-semibold text-ink",
          isPage ? "mt-4 text-xl" : "mt-3 text-base",
        )}
      >
        {title}
      </h3>

      <p className="mt-1.5 max-w-sm text-sm text-muted leading-relaxed">
        {body}
      </p>

      {digest && (
        <p className="mt-2 font-mono text-[11px] text-muted">
          Error code: {digest}
        </p>
      )}

      {onRetry && (
        <div className="mt-4">
          <Button onClick={onRetry} size="sm" variant="outline" className="gap-1.5">
            <Icon icon={RefreshCw} size={14} />
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
