"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Sliders,
  Send,
  Sparkles,
  User,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { ReferenceChip } from "@/components/ui/reference-chip";
import { DemoBadge } from "@/components/ui/demo-badge";
import { PriorityReceipt } from "@/components/ai/priority-receipt";
import { AIAnalysisCard } from "@/components/ai/ai-analysis-card";
import type { Complaint, ComplaintStatus, RejectReason, ComplaintActivity } from "@/domain/types";

interface WorkspaceClientProps {
  complaint: Complaint;
  initialActivities: ComplaintActivity[];
}

export function WorkspaceClient({
  complaint: initialComplaint,
  initialActivities,
}: WorkspaceClientProps) {
  const [complaint, setComplaint] = React.useState<Complaint>(initialComplaint);
  const [activities, setActivities] = React.useState<ComplaintActivity[]>(initialActivities);

  // Status transition states
  const [statusLoading, setStatusLoading] = React.useState(false);
  const [resolveModalOpen, setResolveModalOpen] = React.useState(false);
  const [resolutionNote, setResolutionNote] = React.useState("");
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState<RejectReason>("INSUFFICIENT_INFO");
  const [rejectNote, setRejectNote] = React.useState("");

  // Priority adjustment states
  const [adjustmentValue, setAdjustmentValue] = React.useState(
    complaint.priority.adjustment || 0,
  );
  const [rationale, setRationale] = React.useState("");
  const [adjusting, setAdjusting] = React.useState(false);
  const [adjustSuccess, setAdjustSuccess] = React.useState(false);

  // Internal engineer note state
  const [newNote, setNewNote] = React.useState("");
  const [notePosting, setNotePosting] = React.useState(false);

  const handleStatusChange = async (
    targetStatus: ComplaintStatus,
    payload?: { resolutionNote?: string | undefined; rejectReason?: RejectReason | undefined; note?: string | undefined },
  ) => {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          expectedStatus: complaint.status,
          ...payload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComplaint(data.complaint);
        setResolveModalOpen(false);
        setRejectModalOpen(false);
        // Add activity
        const newAct: ComplaintActivity = {
          id: `act-${Date.now()}`,
          complaintId: complaint.id,
          actorUid: "authority-agent",
          actorName: "Municipal Engineer",
          actorRole: "authority",
          action: `STATUS_CHANGED_${targetStatus}`,
          note: payload?.resolutionNote || payload?.note || undefined,
          createdAt: new Date().toISOString(),
          visibleToReporter: true,
          departmentId: complaint.departmentId,
        };
        setActivities((prev) => [newAct, ...prev]);
      }
    } catch (err) {
      console.warn("Status change error:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAdjustPriority = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rationale.trim() || adjusting) return;
    setAdjusting(true);
    setAdjustSuccess(false);

    try {
      const res = await fetch(`/api/complaints/${complaint.id}/priority`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adjustment: adjustmentValue,
          rationale: rationale.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComplaint(data.complaint);
        setAdjustSuccess(true);
        setTimeout(() => setAdjustSuccess(false), 3000);
      }
    } catch (err) {
      console.warn("Priority adjust error:", err);
    } finally {
      setAdjusting(false);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || notePosting) return;
    setNotePosting(true);

    const act: ComplaintActivity = {
      id: `act-${Date.now()}`,
      complaintId: complaint.id,
      actorUid: "authority-agent",
      actorName: "Municipal Engineer",
      actorRole: "authority",
      action: "ENGINEER_NOTE",
      note: newNote.trim(),
      createdAt: new Date().toISOString(),
      visibleToReporter: false,
      departmentId: complaint.departmentId,
    };
    setActivities((prev) => [act, ...prev]);
    setNewNote("");
    setNotePosting(false);
  };

  const handleVerifiedSeverityChange = async (sev: number) => {
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/priority`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifiedSeverity: sev }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.complaint) {
          setComplaint(data.complaint);
        }
      }
    } catch (err) {
      console.error("Failed to update verified severity:", err);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1360px] mx-auto w-full">
      {/* ── Top Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Link
            href="/authority/queue"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
          >
            <Icon icon={ArrowLeft} size={14} />
            <span>Priority queue</span>
          </Link>
          <span className="text-muted">/</span>
          <ReferenceChip reference={complaint.ref} />
          <DemoBadge />
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={complaint.status} size="md" />
          <PriorityBadge
            band={complaint.priority.band}
            score={complaint.priority.score}
            size="md"
          />
        </div>
      </div>

      {/* ── 8/4 Grid Layout ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* ── Left Column (8 cols): Dossier, Status Actions, Activities ── */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Main Title & Overview Card */}
          <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-md border border-border bg-canvas px-2.5 py-1 text-xs font-bold text-ink">
                {complaint.category}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                <Icon icon={Sparkles} size={13} />
                <span>AI Confidence: {Math.round((complaint.aiConfidence || 0.85) * 100)}%</span>
              </span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl md:text-3xl">
              {complaint.title}
            </h1>

            <p className="text-sm leading-relaxed text-ink whitespace-pre-line">
              {complaint.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 border-t border-border/70 pt-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <Icon icon={MapPin} size={13} className="text-primary" />
                <span>
                  {complaint.location.landmark ? `${complaint.location.landmark}, ` : ""}
                  {complaint.location.wardName || "Bengaluru Ward"}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Icon icon={User} size={13} />
                <span>Filed by {complaint.reporterDisplayName || "Citizen"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Icon icon={ThumbsUp} size={13} />
                <span>{complaint.supporterCount || 0} voices added</span>
              </span>
            </div>

            {/* Attached on-ground photos */}
            {complaint.evidence && complaint.evidence.length > 0 && (
              <div className="mt-4 border-t border-border/70 pt-4">
                <div className="flex items-center justify-between pb-2 text-xs">
                  <span className="font-semibold text-ink">
                    Attached Evidence ({complaint.evidence.length})
                  </span>
                  <span className="text-muted">On-ground photos</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {complaint.evidence.map((item, idx) => (
                    <div
                      key={item.publicId || idx}
                      className="group relative rounded-lg border border-border overflow-hidden bg-canvas aspect-4/3 flex items-center justify-center"
                    >
                      <img
                        src={item.url}
                        alt={`Evidence photo ${idx + 1}`}
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── AI Advisory Analysis & Verified Severity (§27) ── */}
          <AIAnalysisCard
            variant="full"
            source={complaint.aiStatus === "fallback" ? "fallback" : "gemini"}
            verifiedSeverity={complaint.verifiedSeverity}
            onSeverityChange={handleVerifiedSeverityChange}
            analysis={{
              predictedCategory: complaint.category,
              shortSummary: complaint.title,
              extractedKeywords: [complaint.category.toLowerCase(), complaint.location.wardName || "bengaluru"],
              detectedIssue: complaint.title,
              suggestedSeverity: (complaint.verifiedSeverity || 3) as 1 | 2 | 3 | 4 | 5,
              confidence: complaint.aiConfidence || 0.88,
              recommendedDepartment: complaint.departmentName || "ROADS",
              reasoning: `Categorised as ${complaint.category.replace(/_/g, " ")}. Severity level contributes 0.25 to the transparent deterministic Priority Receipt.`,
              possibleDuplicateIndicators: [complaint.location.landmark || "Bengaluru"],
            }}
          />

          {/* ── Action Bar: Status Transitions ── */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
              Triage &amp; Resolution Actions
            </h2>

            <div className="flex flex-wrap items-center gap-2.5">
              {complaint.status === "SUBMITTED" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("UNDER_REVIEW")}
                  disabled={statusLoading}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Icon icon={Clock} size={14} />
                  <span>Mark Under Review</span>
                </Button>
              )}

              {complaint.status === "UNDER_REVIEW" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("ASSIGNED")}
                  disabled={statusLoading}
                  className="gap-1.5 text-xs font-semibold shadow-xs"
                >
                  <Icon icon={Building2} size={14} />
                  <span>Assign to Field Crew</span>
                </Button>
              )}

              {complaint.status === "ASSIGNED" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("IN_PROGRESS")}
                  disabled={statusLoading}
                  className="gap-1.5 text-xs font-semibold shadow-xs"
                >
                  <Icon icon={Building2} size={14} />
                  <span>Start Field Investigation</span>
                </Button>
              )}

              {complaint.status === "IN_PROGRESS" && (
                <Button
                  size="sm"
                  onClick={() => setResolveModalOpen(true)}
                  disabled={statusLoading}
                  className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <Icon icon={CheckCircle2} size={14} />
                  <span>Mark Resolved</span>
                </Button>
              )}

              {complaint.status !== "RESOLVED" && complaint.status !== "CLOSED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectModalOpen(true)}
                  disabled={statusLoading}
                  className="gap-1.5 text-xs font-semibold text-danger hover:text-danger hover:bg-danger/10 border-danger/30"
                >
                  <Icon icon={XCircle} size={14} />
                  <span>Reject / Out of Scope</span>
                </Button>
              )}

              {complaint.status === "RESOLVED" && (
                <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                  <Icon icon={CheckCircle2} size={15} />
                  <span>Marked Resolved · Awaiting Citizen Verification</span>
                </div>
              )}
            </div>

            {/* Resolution Modal / Dropdown Box */}
            {resolveModalOpen && (
              <div className="mt-2 rounded-xl border border-emerald-300 bg-emerald-50/60 p-4 flex flex-col gap-3">
                <h3 className="text-xs font-bold text-emerald-900">
                  Resolution Report &amp; Completion Notes
                </h3>
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Describe the actions taken by field engineers to resolve this issue..."
                  className="w-full rounded-md border border-emerald-300 bg-white p-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setResolveModalOpen(false)}
                    className="h-8 text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleStatusChange("RESOLVED", { resolutionNote: resolutionNote.trim() })
                    }
                    disabled={!resolutionNote.trim() || statusLoading}
                    className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Confirm Resolution
                  </Button>
                </div>
              </div>
            )}

            {/* Reject Modal / Dropdown Box */}
            {rejectModalOpen && (
              <div className="mt-2 rounded-xl border border-red-300 bg-red-50/60 p-4 flex flex-col gap-3">
                <h3 className="text-xs font-bold text-red-900">Rejection Reason</h3>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value as RejectReason)}
                  aria-label="Select rejection reason"
                  className="h-9 rounded-md border border-red-300 bg-white px-2.5 text-xs font-semibold text-ink focus:outline-none"
                >
                  <option value="DUPLICATE">Duplicate report already tracked</option>
                  <option value="OUT_OF_JURISDICTION">Out of department jurisdiction</option>
                  <option value="INSUFFICIENT_INFO">Insufficient information provided</option>
                  <option value="SPAM">Spam or abusive submission</option>
                  <option value="WITHDRAWN_BY_REPORTER">Withdrawn by citizen reporter</option>
                </select>
                <textarea
                  rows={2}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Optional internal justification..."
                  className="w-full rounded-md border border-red-300 bg-white p-2 text-xs text-ink focus:outline-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setRejectModalOpen(false)}
                    className="h-8 text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleStatusChange("REJECTED", {
                        rejectReason,
                        note: rejectNote.trim() || undefined,
                      })
                    }
                    disabled={statusLoading}
                    className="h-8 text-xs font-semibold bg-danger hover:bg-danger text-white"
                  >
                    Reject Report
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Activities & Engineer Notes ── */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
              Activity History &amp; Field Log
            </h2>

            {/* New Note Form */}
            <form onSubmit={handleAddNote} className="flex flex-col gap-2">
              <div className="relative">
                <textarea
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add internal engineer dispatch note..."
                  className="w-full rounded-lg border border-border bg-canvas p-2.5 pr-10 text-xs text-ink focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newNote.trim() || notePosting}
                  aria-label="Post engineer note"
                  className="absolute bottom-3 right-3 text-primary hover:text-primary-hover disabled:opacity-40"
                >
                  <Icon icon={Send} size={15} />
                </button>
              </div>
            </form>

            {/* Timeline */}
            <div className="flex flex-col divide-y divide-border/60">
              {activities.length === 0 ? (
                <p className="text-xs text-muted py-2">No activity records logged yet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="py-2.5 flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">{act.actorName}</span>
                      <span className="text-muted text-[11px]">
                        {new Date(act.createdAt).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <span className="text-xs text-ink-secondary">
                      {act.action.replace("STATUS_CHANGED_", "Status changed to ")}
                    </span>
                    {act.note && (
                      <p className="mt-1 rounded-md bg-canvas p-2 text-xs text-ink italic border border-border/60">
                        &quot;{act.note}&quot;
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column (4 cols): Priority Receipt & Adjustment Tool ── */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          <div className="sticky top-20 flex flex-col gap-6">
            {/* Signature Component: Priority Receipt */}
            <PriorityReceipt priority={complaint.priority} variant="full" />

            {/* ── Priority Adjustment Tool (§29.2) ── */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon icon={Sliders} size={15} className="text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                    Supervisor Priority Override
                  </h3>
                </div>
                <span className="font-mono text-xs font-bold text-primary">
                  {adjustmentValue > 0 ? `+${adjustmentValue}` : adjustmentValue} pts
                </span>
              </div>

              <p className="text-xs text-ink-secondary leading-relaxed">
                Supervisors can adjust priority by ±15 points with mandatory rationale notes.
              </p>

              <form onSubmit={handleAdjustPriority} className="flex flex-col gap-3 pt-1">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-muted font-medium">
                    <span>-15</span>
                    <span>0</span>
                    <span>+15</span>
                  </div>
                  <input
                    type="range"
                    min={-15}
                    max={15}
                    step={1}
                    value={adjustmentValue}
                    onChange={(e) => setAdjustmentValue(parseInt(e.target.value, 10))}
                    aria-label="Priority adjustment points"
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="override-rationale" className="text-xs font-semibold text-ink">
                    Mandatory Rationale Note
                  </label>
                  <textarea
                    id="override-rationale"
                    rows={2}
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="e.g. VIP corridor, school bus route, structural inspection required..."
                    className="w-full rounded-md border border-border bg-canvas p-2 text-xs text-ink focus:border-primary focus:outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={!rationale.trim() || adjusting}
                  className="h-8 gap-1.5 text-xs font-semibold"
                >
                  <span>Apply override</span>
                </Button>

                {adjustSuccess && (
                  <p className="text-xs font-semibold text-emerald-700">
                    Priority adjustment updated!
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
