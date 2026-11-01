"use client";

import * as React from "react";
import Link from "next/link";
import { CivicPulseLogo } from "@/components/auth/civicpulse-logo";
import { Button } from "@/components/ui/button";
import { PlusCircle, Compass, MapPin, Info } from "lucide-react";
import { Icon } from "@/components/ui/icon";

export function PublicTopbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 focus:outline-none">
          <CivicPulseLogo size="sm" variant="dark" showTagline={false} />
        </Link>

        {/* Navigation Links */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Public navigation">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <Icon icon={Compass} size={15} />
            Explore
          </Link>
          <Link
            href="/explore/map"
            className="flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <Icon icon={MapPin} size={15} />
            Live map
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <Icon icon={Info} size={15} />
            About
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="px-2.5 text-xs font-semibold text-muted hover:text-ink sm:px-3 sm:text-sm">
              Sign in
            </Button>
          </Link>
          <Link href="/citizen/complaints/new">
            <Button size="sm" className="gap-1.5 px-2.5 text-xs font-semibold sm:px-3 sm:text-sm">
              <Icon icon={PlusCircle} size={14} />
              <span className="hidden sm:inline">Report an issue</span>
              <span className="sm:hidden">Report</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
