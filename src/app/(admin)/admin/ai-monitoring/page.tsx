import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoBadge } from "@/components/ui/demo-badge";
import { getAiMonitoringMetrics } from "@/server/services/admin";
import { AiMonitoringClient } from "./ai-monitoring-client";

export default async function AdminAiMonitoringPage() {
  const metrics = getAiMonitoringMetrics();

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI telemetry & health"
        description="Monitor Gemini 2.5 Flash token budgets, inference latencies, fallback triggers, and emergency circuit breakers."
        meta={<DemoBadge />}
      />

      <AiMonitoringClient initialMetrics={metrics} />
    </div>
  );
}
