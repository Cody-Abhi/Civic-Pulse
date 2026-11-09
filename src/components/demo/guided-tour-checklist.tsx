"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, Sparkles, ArrowRight } from "lucide-react";
import type { Role } from "@/domain/schemas";

interface TourStep {
  id: string;
  label: string;
  description: string;
  href: string;
  pathMatch: (path: string) => boolean;
}

const TOURS: Record<Role, { title: string; steps: TourStep[] }> = {
  citizen: {
    title: "Citizen Demo Tour",
    steps: [
      {
        id: "report",
        label: "Report an issue",
        description: "Submit a civic issue with optional photo",
        href: "/citizen/complaints/new",
        pathMatch: (p) => p.includes("/citizen/complaints/new"),
      },
      {
        id: "ai-suggestion",
        label: "See AI suggestion",
        description: "Advisory multimodal classification",
        href: "/citizen/complaints/new",
        pathMatch: (p) => p.includes("/citizen/complaints/new"),
      },
      {
        id: "duplicate-radar",
        label: "Duplicate radar",
        description: "Browse nearby duplicates & add your voice",
        href: "/citizen/complaints",
        pathMatch: (p) => p.includes("/citizen/complaints"),
      },
      {
        id: "priority-receipt",
        label: "Priority Receipt",
        description: "Transparent 7-factor explainable score",
        href: "/citizen/complaints",
        pathMatch: (p) => p.startsWith("/citizen/complaints/"),
      },
    ],
  },
  authority: {
    title: "Authority Demo Tour",
    steps: [
      {
        id: "queue",
        label: "Open top-priority complaint",
        description: "Department triage queue sorted by score",
        href: "/authority/queue",
        pathMatch: (p) => p.includes("/authority/queue"),
      },
      {
        id: "duplicate",
        label: "Confirm duplicate",
        description: "Review Duplicate Radar & link reports",
        href: "/authority/queue",
        pathMatch: (p) => p.startsWith("/authority/complaints/"),
      },
      {
        id: "resolve",
        label: "Resolve complaint",
        description: "Department resolution note & photo evidence",
        href: "/authority/queue",
        pathMatch: (p) => p.startsWith("/authority/complaints/"),
      },
    ],
  },
  admin: {
    title: "Admin View-Only Tour",
    steps: [
      {
        id: "ai-monitoring",
        label: "AI monitoring",
        description: "Inference latency, fallbacks & health",
        href: "/admin/ai-monitoring",
        pathMatch: (p) => p.includes("/admin/ai-monitoring"),
      },
      {
        id: "audit-logs",
        label: "Audit log",
        description: "Tamper-evident administrative audit trail",
        href: "/admin/audit-logs",
        pathMatch: (p) => p.includes("/admin/audit-logs"),
      },
      {
        id: "analytics",
        label: "Analytics insight",
        description: "Grounded AI insights citing city metrics",
        href: "/admin/analytics",
        pathMatch: (p) => p.includes("/admin/analytics"),
      },
    ],
  },
};

export function GuidedTourChecklist({ role }: { role: Role }) {
  const pathname = usePathname();
  const tour = TOURS[role];
  const storageKey = `civicpulse_tour_${role}`;

  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [dismissed, setDismissed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? Boolean(JSON.parse(stored).dismissed) : false;
    } catch {
      return false;
    }
  });

  const [collapsed, setCollapsed] = React.useState(false);
  const [completed, setCompleted] = React.useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(storageKey);
      const parsed = stored ? JSON.parse(stored) : null;
      return Array.isArray(parsed?.completed) ? parsed.completed : [];
    } catch {
      return [];
    }
  });

  // Mark current step as completed based on route
  React.useEffect(() => {
    if (!tour || dismissed) return;
    const matched = tour.steps.find((s) => s.pathMatch(pathname));
    if (matched && !completed.includes(matched.id)) {
      queueMicrotask(() => {
        setCompleted((prev) => {
          if (prev.includes(matched.id)) return prev;
          const next = [...prev, matched.id];
          try {
            localStorage.setItem(storageKey, JSON.stringify({ completed: next, dismissed }));
          } catch {}
          return next;
        });
      });
    }
  }, [pathname, tour, completed, dismissed, storageKey]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ completed, dismissed: true }));
    } catch {}
  };

  if (!isMounted || dismissed || !tour) {
    return null;
  }

  const progressPercent = Math.round((completed.length / tour.steps.length) * 100);

  return (
    <aside
      aria-label="Judge Guided Tour"
      data-testid="judge-guided-tour"
      className="fixed bottom-20 md:bottom-4 right-4 z-40 max-w-[calc(100vw-32px)] md:max-w-[340px] w-full rounded-xl border border-primary/20 bg-surface/95 backdrop-blur-md shadow-xl text-ink transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5 bg-primary/5 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold tracking-tight text-ink">
            {tour.title}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
            {completed.length}/{tour.steps.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand guided tour" : "Collapse guided tour"}
            className="p-1 rounded text-muted hover:text-ink hover:bg-sunken transition-colors"
          >
            {collapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss guided tour"
            className="p-1 rounded text-muted hover:text-ink hover:bg-sunken transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-sunken overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps List */}
      {!collapsed && (
        <div className="p-3 flex flex-col gap-2">
          {tour.steps.map((step, idx) => {
            const isDone = completed.includes(step.id);
            const isCurrent = step.pathMatch(pathname);

            return (
              <Link
                key={step.id}
                href={step.href}
                className={`group flex items-start gap-2.5 rounded-lg p-2 text-xs transition-colors ${
                  isCurrent
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-sunken text-ink-secondary"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted group-hover:text-ink" aria-hidden="true" />
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={isDone ? "line-through text-muted" : "font-medium text-ink"}>
                      {idx + 1}. {step.label}
                    </span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
                  </div>
                  <span className="text-[11px] text-muted truncate">
                    {step.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}

