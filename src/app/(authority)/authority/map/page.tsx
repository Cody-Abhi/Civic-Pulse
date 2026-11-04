import type { Metadata } from "next";
import { requireRole } from "@/server/auth/require-role";
import { listComplaints } from "@/server/services/complaints";
import { OpsMapView } from "./ops-map-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operations Map",
  description: "Operational MapLibre GL map for BBMP ward dispatch, hotspot clusters, and field crews.",
};

export default async function AuthorityMapPage() {
  const user = await requireRole(["authority", "admin"]);
  const departmentId = user.role === "admin" ? undefined : (user.departmentId || "roads");

  const complaints = await listComplaints({
    departmentId,
    limit: 200,
  });

  return (
    <main id="main" className="flex flex-1 flex-col overflow-hidden">
      <OpsMapView complaints={complaints} />
    </main>
  );
}
