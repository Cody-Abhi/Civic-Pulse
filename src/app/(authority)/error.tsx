"use client";

import { RouteErrorView } from "@/components/feedback/route-error-view";

export default function AuthorityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorView error={error} reset={reset} areaLabel="Authority Workspace" />;
}

