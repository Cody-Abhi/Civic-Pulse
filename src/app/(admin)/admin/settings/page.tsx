import type { Metadata } from "next";
import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoBadge } from "@/components/ui/demo-badge";
import { getSystemSettings } from "@/server/services/admin";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "System & Formula Settings",
  description: "Priority formula factor weights, duplicate radar sensitivity, AI safety quotas, and synthetic data reset.",
};

export default async function AdminSettingsPage() {
  const settings = await getSystemSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="System settings & governance"
        description="Priority formula factor weights, duplicate radar sensitivity, AI safety quotas, and synthetic data reset."
        meta={<DemoBadge />}
      />

      <SettingsClient initialSettings={settings} />
    </div>
  );
}
