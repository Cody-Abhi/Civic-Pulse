import { notFound } from "next/navigation";
import { getComplaint } from "@/server/services/complaints";
import { ComplaintDetailClient } from "./complaint-detail-client";

export const metadata = {
  title: "Complaint Detail · CivicPulse AI",
  description: "Track status updates, priority receipt, and municipal resolution details.",
};

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const complaint = await getComplaint(id);

  if (!complaint) {
    notFound();
  }

  return <ComplaintDetailClient complaint={complaint} />;
}
