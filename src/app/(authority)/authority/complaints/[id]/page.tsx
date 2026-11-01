import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getComplaint, getComplaintActivities } from "@/server/services/complaints";
import { WorkspaceClient } from "./workspace-client";

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
  };
}

export default async function AuthorityWorkspacePage({
  params,
}: AuthorityWorkspacePageProps) {
  const { id } = await params;
  const complaint = await getComplaint(id);

  if (!complaint) {
    notFound();
  }

  const activities = await getComplaintActivities(complaint.id);

  return (
    <main id="main" className="flex flex-1 flex-col">
      <WorkspaceClient complaint={complaint} initialActivities={activities} />
    </main>
  );
}

