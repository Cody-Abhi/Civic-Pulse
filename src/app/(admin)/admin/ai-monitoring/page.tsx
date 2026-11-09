import type { Metadata } from "next";
import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoBadge } from "@/components/ui/demo-badge";
import { getAiMonitoringMetrics } from "@/server/services/admin";
import { getServerEnv } from "@/lib/server-env";
import { AiMonitoringClient } from "./ai-monitoring-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Health & Telemetry",
  description: "Monitor Gemini token budgets, inference latencies, fallback triggers, and emergency circuit breakers.",
};

export default async function AdminAiMonitoringPage() {
  const env = getServerEnv();
  const metrics = await getAiMonitoringMetrics();

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI telemetry & health"
        description="Monitor Gemini token budgets, inference latencies, fallback triggers, and emergency circuit breakers."
        meta={<DemoBadge />}
      />

      <AiMonitoringClient
        initialMetrics={metrics}
        modelConfig={{
          primary: env.GEMINI_MODEL_PRIMARY,
          fallback: env.GEMINI_MODEL_FALLBACK,
          embedding: env.GEMINI_MODEL_EMBEDDING,
        }}
      />
    </div>
  );
}
