"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Bell, User, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { LiveIndicator } from "@/components/ui/live-indicator";
import type { Role } from "@/domain/schemas";

export interface TopbarProps {
  title?: string | undefined;
  role?: Role | undefined;
  unreadCount?: number | undefined;
  isLive?: boolean | undefined;
  onOpenMobileDrawer?: (() => void) | undefined;
  isMobileDrawerOpen?: boolean | undefined;
  className?: string | undefined;
  actions?: React.ReactNode | undefined;
}

/**
 * Topbar (§12, §17.1)
 * Clean authenticated header.
 * Real notification count (hidden if 0), mobile drawer toggle, and user avatar.
 */
export function Topbar({
  title,
  role = "citizen",
  unreadCount = 0,
  isLive = false,
  onOpenMobileDrawer,
  isMobileDrawerOpen = false,
  className,
  actions,
}: TopbarProps) {
  const isStaff = role === "authority" || role === "admin";

  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-4 md:px-6",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {/* Mobile Drawer Toggle (Authority/Admin only < 768px) */}
        {isStaff && onOpenMobileDrawer && (
          <button
            type="button"
            onClick={onOpenMobileDrawer}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-ink hover:bg-sunken md:hidden focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={isMobileDrawerOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileDrawerOpen}
          >
            <Icon icon={isMobileDrawerOpen ? X : Menu} size={20} />
          </button>
        )}

        {/* Page / Portal Title */}
        {title ? (
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-ink md:text-lg">
              {title}
            </h2>
            <LiveIndicator isLive={isLive} />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-muted uppercase">
              CivicPulse · Bengaluru
            </span>
            <LiveIndicator isLive={isLive} />
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        {actions}

        {/* Notifications Icon (Hidden on mobile for citizen since it's on bottom bar) */}
        <Link
          href={
            role === "admin"
              ? "/admin/notifications"
              : role === "authority"
                ? "/authority/notifications"
                : "/citizen/notifications"
          }
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-muted transition-colors hover:bg-sunken hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary",
            !isStaff && "hidden md:flex",
          )}
          aria-label="View notifications"
        >
          <Icon icon={Bell} size={18} />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : isLive ? (
            <span
              className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-500"
              title="Real-time notifications active"
            />
          ) : null}
        </Link>

        {/* User Account / Profile */}
        <Link
          href={
            role === "admin"
              ? "/admin/settings"
              : role === "authority"
                ? "/authority/profile"
                : "/citizen/profile"
          }
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Account menu and settings"
        >
          <Icon icon={User} size={18} />
        </Link>
      </div>
    </header>
  );
}
