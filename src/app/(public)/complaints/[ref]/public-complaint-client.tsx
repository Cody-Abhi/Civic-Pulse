"use client";

import * as React from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  ThumbsUp,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { ReferenceChip } from "@/components/ui/reference-chip";
import { DemoBadge } from "@/components/ui/demo-badge";
import { PriorityReceipt } from "@/components/ai/priority-receipt";
import type { Complaint, ComplaintStatus } from "@/domain/types";

interface PublicComplaintClientProps {
  complaint: Complaint;
}

const STATUS_STEPS: { status: ComplaintStatus; label: string }[] = [
  { status: "SUBMITTED", label: "Submitted" },
  { status: "UNDER_REVIEW", label: "Under review" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "RESOLVED", label: "Resolved" },
  { status: "CLOSED", label: "Closed" },
];

export function PublicComplaintClient({ complaint: initialComplaint }: PublicComplaintClientProps) {
  const [complaint, setComplaint] = React.useState<Complaint>(initialComplaint);
  const [hasSupported, setHasSupported] = React.useState(false);
  const [supporterCount, setSupporterCount] = React.useState(complaint.supporterCount || 0);
  const [isSupporting, setIsSupporting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleSupport = async () => {
    if (isSupporting || hasSupported) return;
    setIsSupporting(true);

    try {
      const res = await fetch(`/api/complaints/${complaint.id}/support`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setHasSupported(true);
        setSupporterCount(data.supporterCount);
        if (data.complaint?.priority) {
          setComplaint((prev) => ({ ...prev, priority: data.complaint.priority }));
        }
      }
    } catch (err) {
      console.warn("Failed to add support voice:", err);
    } finally {
      setIsSupporting(false);
    }
  };

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const getStepIndex = (s: ComplaintStatus) => {
    switch (s) {
      case "SUBMITTED":
        return 0;
      case "UNDER_REVIEW":
      case "ASSIGNED":
        return 1;
      case "IN_PROGRESS":
      case "REOPENED":
        return 2;
      case "RESOLVED":
        return 3;
      case "CLOSED":
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(complaint.status);

  return (
    <div className="flex flex-col gap-8 py-6 md:py-10">
      {/* ── Breadcrumb & Top Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
          >
            <Icon icon={ArrowLeft} size={14} />
            <span>Public Catalog</span>
          </Link>
          <span className="text-muted">/</span>
          <ReferenceChip reference={complaint.ref} />
          <DemoBadge />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <Icon icon={copied ? Check : Copy} size={14} className={copied ? "text-emerald-600" : ""} />
            <span>{copied ? "Link copied!" : "Share issue"}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSupport}
            disabled={isSupporting || hasSupported}
            className={`h-9 gap-1.5 text-xs font-semibold shadow-xs ${
              hasSupported ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
            }`}
          >
            <Icon icon={ThumbsUp} size={14} className={hasSupported ? "fill-white" : ""} />
            <span>{hasSupported ? "Voice added" : "Add my voice"}</span>
            <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">
              {supporterCount}
            </span>
          </Button>
        </div>
      </div>

      {/* ── 8/4 Split Layout ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        {/* ── Left Column (8 cols): Title, Timeline, Details, Description, Location ── */}
        <div className="flex flex-col gap-6 lg:col-span-7 xl:col-span-8">
          {/* Main Title & Badges */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge band={complaint.priority.band} score={complaint.priority.score} size="md" />
              <StatusBadge status={complaint.status} size="md" />
              <span className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-ink-secondary">
                {complaint.category}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl">
              {complaint.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <Icon icon={MapPin} size={14} className="text-primary" />
                <span>
                  {complaint.location.landmark ? `${complaint.location.landmark}, ` : ""}
                  {complaint.location.wardName || "Bengaluru"}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Icon icon={Calendar} size={14} />
                <span>Reported on {new Date(complaint.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Icon icon={Building2} size={14} />
                <span>Assigned to {complaint.departmentName || "Municipal Works"}</span>
              </span>
            </div>
          </div>

          {/* Status Stepper Card */}
          <div className="rounded-xl border border-border bg-surface p-4 sm:p-6 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
              Resolution Progress
            </h2>
            <div className="relative flex items-center justify-between">
              {/* Connecting line */}
              <div className="absolute left-0 top-3.5 h-0.5 w-full bg-border -z-0" />

              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div key={step.status} className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                        isCurrent
                          ? "border-primary bg-primary text-white ring-4 ring-primary/20"
                          : isPassed
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-border bg-surface text-muted"
                      }`}
                    >
                      {isPassed && !isCurrent ? (
                        <Icon icon={CheckCircle2} size={14} />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-semibold text-center sm:text-xs ${
                        isCurrent
                          ? "text-primary font-bold"
                          : isPassed
                          ? "text-ink"
                          : "text-muted"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Description Section */}
          <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-xs flex flex-col gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
              Reported Description
            </h2>
            <p className="max-w-[72ch] text-base leading-relaxed text-ink whitespace-pre-line">
              {complaint.description}
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted">
              <Icon icon={ShieldCheck} size={14} className="text-primary" />
              <span>Personal identifiers and contact details are automatically redacted on public ledger.</span>
            </div>
          </div>

          {/* Resolution Note (if available) */}
          {complaint.resolution && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-5 shadow-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <Icon icon={CheckCircle2} size={16} />
                <span>Department resolution note</span>
              </div>
              <p className="text-sm text-emerald-900 leading-relaxed">
                {complaint.resolution.note}
              </p>
              <span className="text-xs text-emerald-700">
                Resolved on {new Date(complaint.resolution.resolvedAt).toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {/* Location & Ward Context */}
          <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-xs flex flex-col gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">
              Location & Jurisdiction
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
              <div className="flex flex-col gap-1 rounded-lg border border-border/70 bg-canvas p-3">
                <span className="text-xs font-semibold text-muted">Ward</span>
                <span className="font-bold text-ink">{complaint.location.wardName || "Bengaluru Ward"}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border border-border/70 bg-canvas p-3">
                <span className="text-xs font-semibold text-muted">Landmark</span>
                <span className="font-bold text-ink">{complaint.location.landmark || "Coordinates specified"}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border border-border/70 bg-canvas p-3">
                <span className="text-xs font-semibold text-muted">Latitude / Longitude</span>
                <span className="font-mono text-xs text-ink font-semibold">
                  {complaint.location.lat.toFixed(5)}, {complaint.location.lng.toFixed(5)}
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border border-border/70 bg-canvas p-3">
                <span className="text-xs font-semibold text-muted">Geohash index</span>
                <span className="font-mono text-xs text-ink font-semibold">{complaint.location.geohash5}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column (4 cols): Priority Receipt Signature Ledger ── */}
        <div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4">
          <div className="sticky top-20 flex flex-col gap-4">
            <PriorityReceipt priority={complaint.priority} variant="public" />

            <div className="rounded-xl border border-border bg-surface p-4 text-xs text-muted leading-relaxed">
              <strong className="block font-semibold text-ink mb-1">
                Why was this priority assigned?
              </strong>
              Priority scores are computed by a deterministic 7-factor engine using severity, hazard flags, community reports, SLA waiting time, area density, hotspot proximity, and monsoon seasonality.
            </div>
          </div>
        </div>
      </div>

      {/* ── Public Disclaimer ── */}
      <div className="rounded-xl border border-border/80 bg-surface-subtle p-4 text-center text-xs text-muted shadow-xs">
        Independent prototype · Not affiliated with BBMP, BDA or any government authority. All data shown is synthetic demo data.
      </div>
    </div>
  );
}
