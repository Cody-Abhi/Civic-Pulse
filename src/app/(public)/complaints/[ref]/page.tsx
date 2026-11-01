import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getComplaint } from "@/server/services/complaints";
import { PublicComplaintClient } from "./public-complaint-client";
import { PublicFooter } from "@/components/layout/public-footer";

interface PublicComplaintPageProps {
  params: Promise<{ ref: string }>;
}

export async function generateMetadata({
  params,
}: PublicComplaintPageProps): Promise<Metadata> {
  const { ref } = await params;
  const complaint = await getComplaint(ref);
  if (!complaint) {
    return {
      title: "Issue Not Found · CivicPulse AI",
    };
  }

  return {
    title: `${complaint.ref} · ${complaint.title} · CivicPulse Public Ledger`,
    description: `Public priority score ${complaint.priority.score}/100 (${complaint.priority.band}). Location: ${complaint.location.wardName || "Bengaluru"}.`,
  };
}

export default async function PublicComplaintPage({
  params,
}: PublicComplaintPageProps) {
  const { ref } = await params;
  const complaint = await getComplaint(ref);

  if (!complaint) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-col justify-between">
      <main id="main" className="mx-auto w-full max-w-[1360px] px-4 md:px-8">
        <PublicComplaintClient complaint={complaint} />
      </main>
      <PublicFooter />
    </div>
  );
}
