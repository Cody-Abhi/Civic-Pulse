"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Plus, Compass, Bell, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

interface BottomNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  isAction?: boolean;
}

const CITIZEN_TABS: BottomNavItem[] = [
  { label: "Home", href: "/citizen/dashboard", icon: LayoutDashboard },
  { label: "My reports", href: "/citizen/complaints", icon: FileText },
  { label: "Report", href: "/citizen/complaints/new", icon: Plus, isAction: true },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Alerts", href: "/citizen/notifications", icon: Bell },
];

export interface BottomNavProps {
  className?: string;
  unreadCount?: number;
}

/**
 * BottomNav (§12, §17.1)
 * Citizen mobile bottom tab bar (< 768px).
 * 64px tall + safe-area-inset-bottom with 44x44px tap targets.
 */
export function BottomNav({ className, unreadCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden",
        className,
      )}
    >
      <div className="flex h-16 items-center justify-around px-2">
        {CITIZEN_TABS.map((item) => {
          const isActive =
            item.href === "/citizen/dashboard"
              ? pathname === "/citizen/dashboard"
              : pathname?.startsWith(item.href);

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative -mt-5 flex flex-col items-center justify-center focus:outline-none"
                aria-label="Report new civic issue"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform duration-150 group-hover:scale-105 active:scale-95 group-focus:ring-2 group-focus:ring-primary group-focus:ring-offset-2">
                  <Icon icon={item.icon} size={22} className="stroke-[2.25]" />
                </div>
                <span className="mt-1 text-[11px] font-semibold text-primary">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-[44px] min-w-[48px] flex-col items-center justify-center gap-1 rounded-sm px-2 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                isActive ? "font-semibold text-primary" : "text-muted hover:text-ink",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                <Icon
                  icon={item.icon}
                  size={19}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-primary" : "text-muted group-hover:text-ink",
                  )}
                />
                {item.label === "Alerts" && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
