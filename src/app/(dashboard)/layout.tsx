import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { BottomTabs } from "@/components/layout/bottom-tabs";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Sidebar — hidden on mobile, shown on md+ */}
      <div className="hidden md:block">
        <Sidebar className="h-full" />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-canvas p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <BottomTabs />
    </div>
  );
}
