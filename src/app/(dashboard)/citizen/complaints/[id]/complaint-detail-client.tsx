"use client";
/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  CheckCircle2,
  RotateCcw,
  Building2,
  Share2,
  Check,
  Star,
} from "lucide-react";
import { ReferenceChip } from "@/components/ui/reference-chip";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { DemoBadge } from "@/components/ui/demo-badge";
import { PriorityReceipt } from "@/components/ai/priority-receipt";
import { AIAnalysisCard } from "@/components/ai/ai-analysis-card";
import { Button } from "@/components/ui/button";
import type { Complaint, ComplaintStatus } from "@/domain/types";

export interface ComplaintDetailClientProps {
  complaint: Complaint;
}

const STATUS_STEPS: { key: ComplaintStatus; label: string }[] = [
  { key: "SUBMITTED", label: "Submitted" },
  { key: "UNDER_REVIEW", label: "Under review" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "CLOSED", label: "Closed" },
];

export function ComplaintDetailClient({ complaint: initialComplaint }: ComplaintDetailClientProps) {
  const [complaint, setComplaint] = React.useState<Complaint>(initialComplaint);
  const [showFeedbackModal, setShowFeedbackModal] = React.useState(false);
  const [showReopenModal, setShowReopenModal] = React.useState(false);
  const [rating, setRating] = React.useState<number>(5);
  const [comment, setComment] = React.useState<string>("");
  const [reopenReason, setReopenReason] = React.useState<string>("");
  const [actionLoading, setActionLoading] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Stepper progress index
  const getStepIndex = (status: ComplaintStatus) => {
    switch (status) {
      case "SUBMITTED":
        return 0;
      case "UNDER_REVIEW":
        return 1;
      case "ASSIGNED":
        return 2;
      case "IN_PROGRESS":
        return 3;
      case "RESOLVED":
        return 4;
      case "CLOSED":
        return 5;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(complaint.status);

  // Handle feedback confirmation (T8)
  const handleConfirmFix = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || "Failed to submit resolution feedback.");
      }
      const data = await res.json();
      setComplaint(data.complaint || {
        ...complaint,
        status: "CLOSED",
        feedback: {
          rating: rating as 1 | 2 | 3 | 4 | 5,
          comment,
          at: new Date().toISOString(),
        },
      });
      setShowFeedbackModal(false);
      setToastMessage("Thanks! Your report has been verified and closed.");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      setToastMessage(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reopen (T9)
  const handleReopen = async () => {
    if (reopenReason.trim().length < 10) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REOPENED",
          expectedStatus: "RESOLVED",
          note: reopenReason.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || "Failed to reopen complaint.");
      }
      const data = await res.json();
      setComplaint(data.complaint || {
        ...complaint,
        status: "REOPENED",
        reopenCount: (complaint.reopenCount || 0) + 1,
      });
      setShowReopenModal(false);
      setToastMessage("Report reopened. The municipal department has been alerted.");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      setToastMessage(err instanceof Error ? err.message : "Failed to reopen complaint");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle withdraw (T2)
  const handleWithdraw = async () => {
    if (!confirm("Are you sure you want to withdraw this report? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          expectedStatus: complaint.status,
          rejectReason: "WITHDRAWN_BY_REPORTER",
          note: "Withdrawn by citizen reporter",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || "Failed to withdraw complaint.");
      }
      const data = await res.json();
      setComplaint(data.complaint || {
        ...complaint,
        status: "REJECTED",
      });
      setToastMessage("Report has been withdrawn.");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      setToastMessage(err instanceof Error ? err.message : "Failed to withdraw report");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-md bg-ink px-4 py-3 text-sm text-white shadow-lg animate-in fade-in"
        >
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Link href="/citizen/complaints" className="hover:text-ink hover:underline">
            My reports
          </Link>
          <span>/</span>
          <span className="font-mono text-ink font-semibold">{complaint.ref}</span>
        </div>

        <div className="flex items-center gap-2">
          <DemoBadge />
          {complaint.visibility === "public" && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                setToastMessage("Public link copied to clipboard");
                setTimeout(() => setToastMessage(null), 3000);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface-muted"
            >
              <Share2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>Share</span>
            </button>
          )}
        </div>
      </div>

      {/* Header section */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <ReferenceChip reference={complaint.ref} className="text-sm font-semibold" />
          <StatusBadge status={complaint.status} />
          <PriorityBadge band={complaint.priority.band} score={complaint.priority.score} />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
          {complaint.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Filed {new Date(complaint.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
          </span>
          <span className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{complaint.departmentName}</span>
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>{complaint.location.landmark || complaint.location.wardName || "Bengaluru"}</span>
          </span>
        </div>
      </div>

      {/* Exception banner (REOPENED / REJECTED) */}
      {complaint.status === "REOPENED" && (
        <div className="flex items-center gap-3 rounded-md border border-warning/40 bg-warning-bg/40 p-4 text-sm text-ink">
          <RotateCcw className="h-5 w-5 text-warning shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Report reopened by citizen</p>
            <p className="text-xs text-muted">Municipal engineers have been re-assigned to inspect ground conditions.</p>
          </div>
        </div>
      )}

      {/* Status Stepper */}
      <div className="rounded-md border border-border bg-surface p-6 shadow-xs">
        <h2 className="sr-only">Resolution status</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {STATUS_STEPS.map((s, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div key={s.key} className="flex flex-col gap-1.5 items-start">
                <div className="flex items-center gap-2 w-full">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isCurrent
                        ? "bg-primary text-white ring-2 ring-primary/30"
                        : isCompleted
                          ? "bg-success/20 text-success"
                          : "bg-surface-muted text-muted border border-border"
                    }`}
                  >
                    {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                  </div>
                  <div
                    className={`hidden md:block h-0.5 flex-1 ${
                      idx < currentIndex ? "bg-success" : "bg-border"
                    }`}
                  />
                </div>
                <span
                  className={`text-xs font-medium ${
                    isCurrent ? "font-bold text-primary" : isCompleted ? "text-ink" : "text-muted"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8 / 4 Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Main Column (8 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Contextual Action Bar when RESOLVED */}
          {complaint.status === "RESOLVED" && (
            <div className="flex flex-col gap-3 rounded-md border border-success/30 bg-success/5 p-5">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                <h3 className="font-semibold text-ink text-base">Resolution awaiting your verification</h3>
              </div>
              <p className="text-xs text-ink-muted">
                The municipal department has marked this repair complete. Please check the site and confirm or report that it is not fixed.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button onClick={() => setShowFeedbackModal(true)} className="gap-2">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>Confirm it&apos;s fixed</span>
                </Button>
                <Button variant="outline" onClick={() => setShowReopenModal(true)} className="gap-2">
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>It&apos;s not fixed</span>
                </Button>
              </div>
            </div>
          )}

          {/* Contextual Action Bar when SUBMITTED or UNDER_REVIEW (T2 Withdraw) */}
          {(complaint.status === "SUBMITTED" || complaint.status === "UNDER_REVIEW") && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface p-4 text-xs">
              <span className="text-muted">
                Need to cancel this report? You can withdraw it before department work begins.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleWithdraw}
                disabled={actionLoading}
                className="text-danger hover:bg-danger/10 hover:border-danger/30"
              >
                Withdraw report
              </Button>
            </div>
          )}

          {/* Description */}
          <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-base font-semibold text-ink">Description</h2>
            <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border text-xs">
              <div>
                <span className="text-muted">Estimated duration</span>
                <p className="font-medium text-ink pt-0.5">{complaint.durationBucket.replace(/_/g, " ")}</p>
              </div>
              <div>
                <span className="text-muted">Scope of impact</span>
                <p className="font-medium text-ink pt-0.5">Scale: {complaint.affectedScale}</p>
              </div>
            </div>

            {complaint.hazardFlags.length > 0 && (
              <div className="pt-2">
                <span className="text-xs text-muted">Safety hazards noted</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {complaint.hazardFlags.map((flag) => (
                    <span key={flag} className="rounded bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning">
                      {flag.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location details */}
          <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-base font-semibold text-ink">Location</h2>
            <div className="flex flex-col gap-1 text-sm text-ink">
              <span className="font-medium">{complaint.location.landmark || "Bengaluru"}</span>
              <span className="text-xs text-muted">Ward: {complaint.location.wardName || complaint.location.wardId}</span>
              <span className="font-mono text-xs text-muted pt-1">
                Lat: {complaint.location.lat.toFixed(5)}, Lng: {complaint.location.lng.toFixed(5)}
              </span>
            </div>
          </div>

          {/* Attached Evidence Photos */}
          {complaint.evidence && complaint.evidence.length > 0 && (
            <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-ink">
                  Attached Evidence ({complaint.evidence.length})
                </h2>
                <span className="text-xs text-muted">On-ground photos</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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

          {/* Advisory AI Card */}
          <AIAnalysisCard
            variant="compact"
            source={complaint.aiStatus === "fallback" ? "fallback" : "gemini"}
            analysis={{
              predictedCategory: complaint.category,
              shortSummary: complaint.title,
              extractedKeywords: [complaint.category.toLowerCase(), complaint.location.wardName || "bengaluru"],
              detectedIssue: complaint.title,
              suggestedSeverity: (complaint.verifiedSeverity || 3) as 1 | 2 | 3 | 4 | 5,
              confidence: complaint.aiConfidence || 0.88,
              recommendedDepartment: complaint.departmentName || "ROADS",
              reasoning: `Triaged via municipal classification pipeline. Initial priority computed at ${complaint.priority.score}/100.`,
              possibleDuplicateIndicators: [complaint.location.landmark || "Bengaluru"],
            }}
          />

          {/* Resolution section (if present) */}
          {complaint.resolution && (
            <div className="rounded-md border border-success/30 bg-surface p-6 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <h3 className="font-semibold text-ink text-base">Municipal Ground Resolution</h3>
              </div>
              <p className="text-sm text-ink-muted leading-relaxed">
                {complaint.resolution.note}
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted">
                <span>Verified by field team</span>
                <span>{new Date(complaint.resolution.resolvedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
              </div>
            </div>
          )}

          {/* Citizen feedback (if present) */}
          {complaint.feedback && (
            <div className="rounded-md border border-border bg-surface p-6 flex flex-col gap-2 shadow-xs">
              <h3 className="font-semibold text-ink text-base">Your feedback</h3>
              <div className="flex items-center gap-1 text-warning">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= (complaint.feedback?.rating || 5) ? "fill-warning text-warning" : "text-border"
                    }`}
                  />
                ))}
              </div>
              {complaint.feedback.comment && (
                <p className="text-xs text-ink-muted pt-1">{complaint.feedback.comment}</p>
              )}
            </div>
          )}
        </div>

        {/* Side Column (4 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Priority Receipt */}
          <PriorityReceipt priority={complaint.priority} variant="full" />

          {/* Department card */}
          <div className="rounded-md border border-border bg-surface p-5 flex flex-col gap-3 shadow-xs">
            <h3 className="font-semibold text-ink text-sm">Assigned Authority</h3>
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-ink">{complaint.departmentName}</span>
              <span className="text-muted">Target SLA: {complaint.slaHours} hours</span>
              <span className="text-muted">Monitored under BBMP Public Grievance Guidelines</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Fix Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex flex-col gap-4 w-full max-w-md rounded-md bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-bold text-ink">Confirm resolution</h3>
            <p className="text-xs text-muted">
              Rate the quality of the municipal fix on the ground.
            </p>

            <div className="flex items-center justify-center gap-2 py-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-1 text-warning focus:outline-none"
                >
                  <Star
                    className={`h-7 w-7 ${
                      s <= rating ? "fill-warning text-warning" : "text-border"
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional comment for the municipal team..."
              className="rounded border border-border p-2.5 text-xs text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowFeedbackModal(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmFix} disabled={actionLoading}>
                {actionLoading ? "Saving..." : "Verify & close report"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex flex-col gap-4 w-full max-w-md rounded-md bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-bold text-ink">Report not fixed</h3>
            <p className="text-xs text-muted">
              Explain why the ground issue remains unaddressed. (Minimum 10 characters required)
            </p>

            <textarea
              rows={4}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="e.g. Only half the pothole was filled with mud, or the street light bulb was not replaced."
              className="rounded border border-border p-2.5 text-xs text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowReopenModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleReopen}
                disabled={reopenReason.trim().length < 10 || actionLoading}
              >
                {actionLoading ? "Reopening..." : "Reopen ticket"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
