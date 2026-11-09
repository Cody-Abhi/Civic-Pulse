"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { BottomNav } from "./bottom-nav";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { GuidedTourChecklist } from "@/components/demo/guided-tour-checklist";
import type { Role } from "@/domain/schemas";

export interface AppShellProps {
  role?: Role;
  title?: string;
  children: React.ReactNode;
  unreadCount?: number;
  className?: string;
}

/**
 * AppShell (§12, §17.1)
 * Unified authenticated dashboard shell:
 * - Desktop (≥1024px): 264px sidebar
 * - Tablet (768–1023px): 72px icon rail
 * - Mobile (<768px):
 *   - Citizen: 64px bottom tab bar
 *   - Authority/Admin: top bar with drawer
 */
export function AppShell({
  role = "citizen",
  title,
  children,
  unreadCount = 0,
  className,
}: AppShellProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { unreadCount: liveUnread, isLive } = useRealtimeNotifications();
  const effectiveUnread = isLive ? liveUnread : (unreadCount || liveUnread);
  const isCitizen = role === "citizen";

  const closeDrawer = useCallback(() => setMobileDrawerOpen(false), []);
  const toggleDrawer = useCallback(
    () => setMobileDrawerOpen((prev) => !prev),
    [],
  );

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-canvas">
      {/* Desktop/Tablet Sidebar (Hidden on mobile < 768px) */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar role={role} unreadCount={effectiveUnread} />
      </div>

      {/* Authority/Admin Mobile Slide-Over Drawer (< 768px) */}
      {!isCitizen && mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          {/* Drawer content */}
          <div className="relative z-10 flex w-72 max-w-[85vw] flex-col bg-surface shadow-xl">
            <Sidebar role={role} unreadCount={effectiveUnread} className="w-full border-r-0" />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          title={title}
          role={role}
          unreadCount={effectiveUnread}
          isLive={isLive}
          onOpenMobileDrawer={toggleDrawer}
          isMobileDrawerOpen={mobileDrawerOpen}
        />

        <main
          id="dashboard-main"
          className={cn(
            "flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8",
            // Reserve space for bottom nav on mobile for citizen role
            isCitizen && "pb-24 md:pb-8",
            className,
          )}
          style={{
            scrollPaddingBottom: isCitizen ? "96px" : "32px",
          }}
        >
          <div className="mx-auto w-full max-w-[1360px]">{children}</div>
        </main>

        {/* Citizen Mobile Bottom Tab Bar */}
        {isCitizen && <BottomNav unreadCount={effectiveUnread} />}

        {/* Judge Mode Guided Tour Checklist (PRD Block D §1) */}
        <GuidedTourChecklist role={role} />
      </div>
    </div>
  );
}
