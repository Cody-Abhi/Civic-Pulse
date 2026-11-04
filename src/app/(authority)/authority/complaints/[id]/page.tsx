import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth/require-role";
import { getComplaint, getComplaintActivities } from "@/server/services/complaints";
import { WorkspaceClient } from "./workspace-client";

export const dynamic = "force-dynamic";

interface AuthorityWorkspacePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AuthorityWorkspacePageProps): Promise<Metadata> {
  const { id } = await params;
  const complaint = await getComplaint(id);

  if (!complaint) {
    return { title: "Workspace Issue Not Found" };
  }

  return {
    title: `[Workspace] ${complaint.ref} · ${complaint.title}`,
    description: `Authority dispatch workspace for complaint ${complaint.ref}. Priority score: ${complaint.priority.score}/100.`,
    robots: { index: false, follow: false },
  };
}

export default async function AuthorityWorkspacePage({
  params,
}: AuthorityWorkspacePageProps) {
  const user = await requireRole(["authority", "admin"]);
  const { id } = await params;
  const complaint = await getComplaint(id);

  if (!complaint) {
    notFound();
  }

  const activities = await getComplaintActivities(complaint.id);

  return (
    <main id="main" className="flex flex-1 flex-col">
      <WorkspaceClient
        complaint={complaint}
        initialActivities={activities}
        currentUserRole={user.role}
        currentUserDepartmentId={user.departmentId}
      />
    </main>
  );
}
