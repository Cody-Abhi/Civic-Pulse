"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  MapPin,
  Bell,
  User,
  Settings,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CivicPulseLogo } from "@/components/auth/civicpulse-logo";
import { Icon } from "@/components/ui/icon";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/citizen/dashboard", icon: LayoutDashboard },
  { label: "My Reports", href: "/citizen/complaints", icon: FileText },
  { label: "Analytics", href: "/citizen/analytics", icon: BarChart3 },
  { label: "Map", href: "/citizen/map", icon: MapPin },
  { label: "Notifications", href: "/citizen/notifications", icon: Bell },
  { label: "Profile", href: "/citizen/profile", icon: User },
  { label: "Settings", href: "/citizen/settings", icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const skipMotion = useSafeReducedMotion();
  const [darkMode, setDarkMode] = React.useState(false);

  return (
    <aside
      className={cn(
        "flex h-full w-[220px] flex-col py-5",
        className,
      )}
      style={{ backgroundColor: "var(--cp-sidebar-bg)" }}
    >
      {/* Logo */}
      <div className="px-5 pb-6">
        <CivicPulseLogo variant="light" size="sm" />
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href) ?? false;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "text-white"
                  : "text-white/60 hover:text-white/90",
              )}
            >
              {isActive && (
                skipMotion ? (
                  <span
                    className="absolute inset-0 rounded-lg"
                    style={{ backgroundColor: "var(--cp-sidebar-active)" }}
                  />
                ) : (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg"
                    style={{ backgroundColor: "var(--cp-sidebar-active)" }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )
              )}
              <span className="relative z-10 flex items-center gap-3">
                <Icon
                  icon={item.icon}
                  size={18}
                  className={cn(
                    isActive ? "text-white" : "text-white/50 group-hover:text-white/80",
                  )}
                />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className="mt-auto px-3">
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:text-white/90"
        >
          <Icon icon={darkMode ? Sun : Moon} size={18} className="text-white/50" />
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </aside>
  );
}
