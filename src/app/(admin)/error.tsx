"use client";

import { RouteErrorView } from "@/components/feedback/route-error-view";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorView error={error} reset={reset} areaLabel="Admin Administration" />;
}

