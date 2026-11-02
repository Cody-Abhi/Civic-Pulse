"use client";

import { RouteErrorView } from "@/components/feedback/route-error-view";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorView error={error} reset={reset} areaLabel="Public Catalog" />;
}

