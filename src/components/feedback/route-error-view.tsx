"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RouteErrorViewProps {
  error: Error & { digest?: string };
  reset: () => void;
  areaLabel?: string;
}

export function RouteErrorView({ error, reset, areaLabel }: RouteErrorViewProps) {
  React.useEffect(() => {
    // Log error with digest to console (no PII) per PRD UI-32
    console.error(
      `[${areaLabel || "Route"}] Render error:`,
      error.message,
      error.digest ? `(digest: ${error.digest})` : "",
    );
  }, [error, areaLabel]);

  return (
    <div className="flex min-h-[360px] w-full flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
          <AlertCircle className="h-7 w-7" aria-hidden="true" />
        </div>

        <span className="mb-1.5 font-mono text-xs font-bold tracking-wider text-danger uppercase">
          Application Error
        </span>

        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Something went wrong on our side.
        </h2>

        <p className="mt-2 text-sm text-muted">
          We encountered an unexpected error while loading this {areaLabel || "page"}. Your other civic actions and dashboard tabs remain active.
        </p>

        {error.digest && (
          <div className="mt-4 rounded border border-border bg-sunken px-3 py-1 font-mono text-xs text-muted">
            Support reference: <span className="font-semibold text-ink">{error.digest}</span>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            onClick={() => reset()}
            className="flex min-h-[44px] sm:min-h-[38px] w-full sm:w-auto items-center justify-center gap-2"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Try again</span>
          </Button>

          <Link
            href="/"
            className="flex min-h-[44px] sm:min-h-[38px] w-full sm:w-auto items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-sunken focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Go home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

