import * as React from "react";
import { PublicTopbar } from "@/components/layout/public-topbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <PublicTopbar />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
