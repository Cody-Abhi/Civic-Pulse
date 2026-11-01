"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, PlusCircle, Map, Bell, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

interface TabItem {
  label: string;
  href: string;
  icon: LucideIcon;
  isAction?: boolean;
}

const TABS: TabItem[] = [
  { label: "Home", href: "/citizen/dashboard", icon: Home },
  { label: "My reports", href: "/citizen/complaints", icon: FileText },
  { label: "Report", href: "/citizen/complaints/new", icon: PlusCircle, isAction: true },
  { label: "Explore", href: "/explore", icon: Map },
  { label: "Alerts", href: "/citizen/notifications", icon: Bell },
];

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[var(--cp-z-sticky)] border-t border-border bg-surface md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Mobile navigation"
    >
      <div className="flex h-16 items-center justify-around">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/citizen/dashboard" && pathname?.startsWith(tab.href));

          if (tab.isAction) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center gap-0.5 -mt-3"
                aria-label={tab.label}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-on-primary shadow-e2">
                  <Icon icon={tab.icon} size={22} />
                </span>
                <span className="text-[10px] font-medium text-primary">{tab.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex min-w-[44px] flex-col items-center justify-center gap-0.5 px-2 py-1",
                isActive ? "text-primary" : "text-muted",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon icon={tab.icon} size={20} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
