"use client";

import * as React from "react";
import Link from "next/link";
import { Radio, Users, MapPin, ExternalLink, ThumbsUp, Loader2, CheckCircle2 } from "lucide-react";
import { ReferenceChip } from "@/components/ui/reference-chip";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import type { DuplicateCandidateResult } from "@/server/services/ai";

export interface DuplicateRadarProps {
  candidates: DuplicateCandidateResult[];
  loading?: boolean;
  onAddVoice?: (candidateId: string) => Promise<void>;
  isAddingVoice?: string | null;
  supportedIds?: string[];
  className?: string;
}

export function DuplicateRadar({
  candidates,
  loading = false,
  onAddVoice,
  isAddingVoice,
  supportedIds = [],
  className = "",
}: DuplicateRadarProps) {
  if (loading) {
    return (
      <div className={`rounded-xl border border-border bg-surface p-6 shadow-xs flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className="flex items-center gap-2 text-primary">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-sm font-semibold text-ink">Scanning 500m radius for duplicate reports…</span>
        </div>
        <p className="text-xs text-muted">Checking active complaints in Bellandur &amp; surrounding wards</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-xs flex flex-col gap-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" aria-hidden="true" />
          <h3 className="font-semibold text-ink text-sm sm:text-base">Duplicate Radar</h3>
        </div>
        <span className="text-xs text-muted">
          500m radius · 30-day window
        </span>
      </div>

      {candidates.length === 0 ? (
        <div className="flex flex-col gap-1.5 py-2">
          <p className="text-xs text-ink-muted">
            No active duplicate reports found matching this location and description. Your issue will be registered as a primary ticket.
          </p>
          <span className="text-[11px] text-muted">
            Nearby reports will automatically link to your ticket if reported later.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-ink-muted">
            We found {candidates.length} active issue{candidates.length > 1 ? "s" : ""} nearby that may match your report. Adding your voice boosts the priority faster than filing a duplicate.
          </p>

          <div className="flex flex-col gap-3">
            {candidates.map((cand) => {
              const isAlreadySupported = supportedIds.includes(cand.id);
              const isSupportingThis = isAddingVoice === cand.id;

              return (
                <div
                  key={cand.id}
                  className="rounded-lg border border-border bg-canvas/60 p-4 flex flex-col gap-3 transition-colors hover:border-primary/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ReferenceChip reference={cand.ref} size="sm" />
                      <StatusBadge status={cand.status} size="sm" />
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        cand.label === "LIKELY"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-blue-100 text-blue-900 border border-blue-300"
                      }`}
                    >
                      {cand.label === "LIKELY" ? "Very similar (≥70%)" : "Possibly related"}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-ink line-clamp-2">
                    {cand.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1 text-primary">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{cand.distanceM} m away</span>
                    </span>

                    <span>{cand.hoursAgo > 24 ? `${Math.round(cand.hoursAgo / 24)}d ago` : `${Math.round(cand.hoursAgo)}h ago`}</span>

                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{cand.supporterCount} voice{cand.supporterCount !== 1 ? "s" : ""}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                    {cand.isPublic ? (
                      <Link
                        href={`/complaints/${cand.ref}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <span>View public report</span>
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    ) : (
                      <span className="text-[11px] text-muted italic">Private complaint</span>
                    )}

                    {onAddVoice && cand.isPublic && (
                      <Button
                        size="sm"
                        disabled={isAlreadySupported || isSupportingThis}
                        onClick={() => onAddVoice(cand.id)}
                        className={`gap-1.5 text-xs font-semibold ${
                          isAlreadySupported ? "bg-success text-white" : ""
                        }`}
                      >
                        {isSupportingThis ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            <span>Adding voice…</span>
                          </>
                        ) : isAlreadySupported ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Voice Added</span>
                          </>
                        ) : (
                          <>
                            <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Add my voice instead</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

