import type { Metadata } from "next";
import { listComplaints } from "@/server/services/complaints";
import { QueueView } from "./queue-view";

export const metadata: Metadata = {
  title: "Priority Queue · Engineering Operations",
  description: "Ranked operational queue for municipal engineers with 7-factor priority scores.",
};

export default async function AuthorityQueuePage() {
  const complaints = await listComplaints({
    limit: 150,
  });

  return (
    <main id="main" className="flex flex-1 flex-col">
      <QueueView initialComplaints={complaints} />
    </main>
  );
}

