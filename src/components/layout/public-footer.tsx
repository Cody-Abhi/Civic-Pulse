import * as React from "react";
import Link from "next/link";
import { CivicPulseLogo } from "@/components/auth/civicpulse-logo";

export function PublicFooter() {
  return (
    <footer className="w-full border-t border-border bg-surface text-ink">
      <div className="mx-auto max-w-[1360px] px-4 py-12 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand & Mission */}
          <div className="flex flex-col gap-3 md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <CivicPulseLogo size="sm" variant="dark" showTagline={false} />
            </Link>
            <p className="max-w-[48ch] text-xs leading-relaxed text-muted">
              Turning citizen voices into intelligent city action. An independent civic-tech
              prototype engineered for transparent, auditable prioritization and zero-duplicate
              civic workflows.
            </p>
            <p className="text-[11px] font-semibold text-ink-secondary">
              Independent prototype · Not affiliated with BBMP, BDA or any government authority.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold tracking-wider text-ink uppercase">Platform</h4>
            <Link href="/explore" className="text-xs text-muted hover:text-ink">
              Public Explorer
            </Link>
            <Link href="/explore/map" className="text-xs text-muted hover:text-ink">
              Ward Hotspot Map
            </Link>
            <Link href="/citizen/complaints/new" className="text-xs text-muted hover:text-ink">
              Report Civic Issue
            </Link>
            <Link href="/login" className="text-xs text-muted hover:text-ink">
              Portal Sign In
            </Link>
          </div>

          {/* Transparency & Attributions */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold tracking-wider text-ink uppercase">Transparency</h4>
            <Link href="/about" className="text-xs text-muted hover:text-ink">
              About &amp; Methodology
            </Link>
            <Link href="/about#priority" className="text-xs text-muted hover:text-ink">
              Priority Formula
            </Link>
            <Link href="/about#ai" className="text-xs text-muted hover:text-ink">
              Responsible AI Policy
            </Link>
            <p className="pt-2 text-[10px] leading-relaxed text-muted">
              Map data © <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer" className="underline hover:text-ink">OpenStreetMap</a> · Tiles © <a href="https://openfreemap.org" target="_blank" rel="noreferrer" className="underline hover:text-ink">OpenFreeMap</a> · Wards © DataMeet (CC BY 4.0).
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between border-t border-border pt-6 text-xs text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} CivicPulse AI. MIT Licence.</span>
          <span className="font-mono text-[11px]">Bengaluru Ward Pilot</span>
        </div>
      </div>
    </footer>
  );
}
