import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-1", className)}>
      {breadcrumb && (
        <nav className="text-sm text-muted" aria-label="Breadcrumb">
          {breadcrumb}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-bold leading-tight tracking-[-0.02em] text-ink md:text-[30px]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
