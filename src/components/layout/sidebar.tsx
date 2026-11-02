"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Compass,
  Bell,
  Settings,
  MapPin,
  BarChart3,
  Users,
  Building2,
  Cpu,
  History,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CivicPulseLogo } from "@/components/auth/civicpulse-logo";
import { Icon } from "@/components/ui/icon";
import type { Role } from "@/domain/schemas";

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

const CITIZEN_NAV: SidebarNavItem[] = [
  { label: "Dashboard", href: "/citizen/dashboard", icon: LayoutDashboard },
  { label: "My reports", href: "/citizen/complaints", icon: FileText },
  { label: "Report issue", href: "/citizen/complaints/new", icon: PlusCircle },
  { label: "Explore city", href: "/explore", icon: Compass },
  { label: "Notifications", href: "/citizen/notifications", icon: Bell },
  { label: "Settings", href: "/citizen/settings", icon: Settings },
];

const AUTHORITY_NAV: SidebarNavItem[] = [
  { label: "Dashboard", href: "/authority/dashboard", icon: LayoutDashboard },
  { label: "Priority queue", href: "/authority/complaints", icon: FileText },
  { label: "Operations map", href: "/authority/map", icon: MapPin },
  { label: "Analytics", href: "/authority/analytics", icon: BarChart3 },
  { label: "Notifications", href: "/authority/notifications", icon: Bell },
  { label: "Profile", href: "/authority/profile", icon: Settings },
];

const ADMIN_NAV: SidebarNavItem[] = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users & roles", href: "/admin/users", icon: Users },
  { label: "Departments", href: "/admin/departments", icon: Building2 },
  { label: "Complaints", href: "/admin/complaints", icon: FileText },
  { label: "City analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "AI health", href: "/admin/ai-monitoring", icon: Cpu },
  { label: "Audit logs", href: "/admin/audit-logs", icon: History },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Settings", href: "/admin/settings", icon: Shield },
];

export interface SidebarProps {
  role?: Role;
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  unreadCount?: number;
}

/**
 * Sidebar (§12, §17.1)
 * Desktop 264px sidebar / Tablet 72px collapsed icon rail.
 */
export function Sidebar({
  role = "citizen",
  className,
  unreadCount = 0,
}: SidebarProps) {
  const pathname = usePathname();

  const navItems =
    role === "admin"
      ? ADMIN_NAV
      : role === "authority"
        ? AUTHORITY_NAV
        : CITIZEN_NAV;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-surface text-ink transition-all duration-200",
        "w-[72px] lg:w-[264px]",
        className,
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center border-b border-border px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2.5 focus:outline-none">
          <CivicPulseLogo size="sm" variant="dark" showTagline={false} />
        </Link>
      </div>

      {/* Nav List */}
      <nav
        className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
        aria-label="Sidebar navigation"
      >
        {navItems.map((item) => {
          const isActive =
            item.href === "/citizen/dashboard" ||
            item.href === "/authority/dashboard" ||
            item.href === "/admin/dashboard"
              ? pathname === item.href
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                "justify-center lg:justify-start",
                isActive
                  ? "bg-primary-subtle text-primary font-semibold"
                  : "text-muted hover:bg-sunken hover:text-ink",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative shrink-0">
                <Icon
                  icon={item.icon}
                  size={19}
                  className={cn(
                    "transition-colors",
                    isActive ? "text-primary" : "text-muted group-hover:text-ink",
                  )}
                />
                {item.label === "Notifications" && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>

              <span className="hidden truncate lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Role Indicator Footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-md bg-sunken/60 px-2.5 py-2 text-xs">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
            {role.charAt(0).toUpperCase()}
          </div>
          <div className="hidden flex-col truncate lg:flex">
            <span className="font-semibold text-ink capitalize">{role} workspace</span>
            <span className="text-[10px] text-muted truncate">Bengaluru Hub</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
