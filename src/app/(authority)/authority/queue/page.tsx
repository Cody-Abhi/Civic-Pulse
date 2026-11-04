import type { Metadata } from "next";
import { requireRole } from "@/server/auth/require-role";
import { listComplaints } from "@/server/services/complaints";
import { QueueView } from "./queue-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Priority Queue",
  description: "Ranked operational queue for municipal engineers with 7-factor priority scores.",
};

export default async function AuthorityQueuePage() {
  const user = await requireRole(["authority", "admin"]);
  const departmentId = user.role === "admin" ? undefined : (user.departmentId || "roads");

  const complaints = await listComplaints({
    departmentId,
    limit: 150,
  });

  return (
    <main id="main" className="flex flex-1 flex-col">
      <QueueView
        initialComplaints={complaints}
        currentUserDepartmentId={user.departmentId}
        currentUserRole={user.role}
      />
    </main>
  );
}
