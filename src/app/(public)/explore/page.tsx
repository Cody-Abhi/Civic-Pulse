import type { Metadata } from "next";
import { listComplaints } from "@/server/services/complaints";
import { ExploreView } from "./explore-view";
import { PublicFooter } from "@/components/layout/public-footer";

export const metadata: Metadata = {
  title: "Explore Civic Issues · Public Ledger",
  description:
    "Search, filter and inspect civic issues reported across Bengaluru wards. Prioritised deterministically with public priority receipts.",
};

export default async function ExplorePage() {
  const initialComplaints = await listComplaints({
    isPublicOnly: true,
    limit: 240,
  });

  return (
    <div className="flex min-h-full flex-col justify-between">
      <main id="main" className="mx-auto w-full max-w-[1360px] px-4 md:px-8">
        <ExploreView initialComplaints={initialComplaints} />
      </main>
      <PublicFooter />
    </div>
  );
}
