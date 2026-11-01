"use client";

import { Search, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { NotificationBell } from "@/components/motion/notification-bell";

export function Topbar({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "flex h-16 items-center gap-4 border-b border-border bg-surface px-6",
        className,
      )}
    >
      {/* Search */}
      <div className="relative flex-1">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          placeholder="Search anything..."
          className="h-10 w-full max-w-md rounded-lg border border-border bg-sunken pl-10 pr-4 text-sm text-ink placeholder:text-muted outline-none transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(15,118,110,0.08)]"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <NotificationBell hasNotifications count={3} />
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-all duration-200 hover:bg-primary/20 hover:shadow-sm"
          aria-label="User menu"
        >
          <Icon icon={User} size={20} className="text-primary" />
        </button>
      </div>
    </header>
  );
}
