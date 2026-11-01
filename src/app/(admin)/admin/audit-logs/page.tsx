import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoBadge } from "@/components/ui/demo-badge";
import { getAuditLogs } from "@/server/services/admin";
import { AuditLogsClient } from "./audit-logs-client";

export default async function AdminAuditLogsPage() {
  const logs = getAuditLogs({ limit: 100 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit trail"
        description="Immutable governance log capturing user role mutations, department edits, severity recalibrations, and AI safety activations."
        meta={<DemoBadge />}
      />

      <AuditLogsClient initialLogs={logs} />
    </div>
  );
}
