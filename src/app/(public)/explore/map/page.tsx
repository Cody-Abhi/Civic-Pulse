import type { Metadata } from "next";
import { listComplaints } from "@/server/services/complaints";
import { MapView } from "./map-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Bengaluru Civic Map · OpenFreeMap",
  description:
    "Interactive MapLibre GL map of Bengaluru civic issues with density clusters and priority-banded points.",
};

export default async function ExploreMapPage() {
  const complaints = await listComplaints({
    isPublicOnly: true,
    limit: 240,
  });

  return (
    <main id="main" className="flex flex-1 flex-col overflow-hidden">
      <MapView complaints={complaints} />
    </main>
  );
}
