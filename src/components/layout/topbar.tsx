"use client";

import { Menu, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

export function Topbar({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "flex h-16 items-center gap-4 border-b border-border bg-surface px-4 md:px-6",
        className,
      )}
    >
      {/* Mobile menu trigger — placeholder for drawer */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-sunken hover:text-ink md:hidden"
        aria-label="Open menu"
      >
        <Icon icon={Menu} size={20} />
      </button>

      <div className="flex-1" />

      {/* User avatar */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-colors hover:bg-primary/20"
        aria-label="User menu"
      >
        <Icon icon={User} size={20} className="text-primary" />
      </button>
    </header>
  );
}
