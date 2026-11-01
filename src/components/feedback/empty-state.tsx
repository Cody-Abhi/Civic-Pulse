import * as React from "react";
import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

export interface EmptyStateProps {
  title: string;
  body?: string | undefined;
  action?: React.ReactNode | undefined;
  icon?: LucideIcon | undefined;
  variant?: "page" | "panel" | undefined;
  className?: string | undefined;
}

/**
 * EmptyState (§17.1)
 * Accessible empty container with clear next action, avoiding dead ends.
 */
export function EmptyState({
  title,
  body,
  action,
  icon = Inbox,
  variant = "panel",
  className,
}: EmptyStateProps) {
  const isPage = variant === "page";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isPage ? "min-h-[380px] p-8 md:p-12" : "p-6 md:p-8",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-subtle text-primary">
        <Icon icon={icon} size={26} />
      </div>

      <h3
        className={cn(
          "font-semibold text-ink",
          isPage ? "mt-4 text-xl" : "mt-3 text-base",
        )}
      >
        {title}
      </h3>

      {body && (
        <p className="mt-1.5 max-w-sm text-sm text-muted leading-relaxed">
          {body}
        </p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
