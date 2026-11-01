"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  title?: string | undefined;
  message?: string | undefined;
  onRetry?: (() => void) | undefined;
  className?: string | undefined;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn’t load this data. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 py-12 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg">
        <Icon icon={AlertTriangle} size={24} className="text-danger" />
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="max-w-[40ch] text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  );
}
