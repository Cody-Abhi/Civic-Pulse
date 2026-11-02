import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getComplaint } from "@/server/services/complaints";
import { ComplaintDetailClient } from "./complaint-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const complaint = await getComplaint(id);
  if (!complaint) {
    return {
      title: "Complaint Detail",
      description: "Track status updates, priority receipt, and municipal resolution details.",
    };
  }

  const isSynthetic = Boolean(
    complaint.isSynthetic ||
    complaint.reporterUid?.startsWith("seed-") ||
    complaint.reporterUid?.startsWith("demo-")
  );

  return {
    title: `${complaint.ref} · ${complaint.title}`,
    description: `Track complaint status updates, 7-factor priority receipt, and municipal resolution details.`,
    robots: isSynthetic ? { index: false, follow: false } : { index: true, follow: true },
  };
}

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
