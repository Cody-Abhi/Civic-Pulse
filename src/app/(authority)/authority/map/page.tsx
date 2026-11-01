import type { Metadata } from "next";
import { listComplaints } from "@/server/services/complaints";
import { OpsMapView } from "./ops-map-view";

export const metadata: Metadata = {
  title: "Operations Dispatch Map · CivicPulse AI",
  description: "Operational MapLibre GL map for BBMP ward dispatch, hotspot clusters, and field crews.",
};

export default async function AuthorityMapPage() {
  const complaints = await listComplaints({
    limit: 200,
  });

  return (
    <main id="main" className="flex flex-1 flex-col overflow-hidden">
      <OpsMapView complaints={complaints} />
    </main>
  );
}

