"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, Clock, Loader2, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoBadge } from "@/components/ui/demo-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import type { Notification } from "@/domain/types";

function formatRelativeTime(createdAtIso: string): string {
  const date = new Date(createdAtIso);
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSeconds < 60) return "Just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

export default function AuthorityNotificationsPage() {
  const [items, setItems] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"ALL" | "UNREAD">("ALL");

  React.useEffect(() => {
    let isMounted = true;
    const load = () => {
      fetch("/api/notifications")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (isMounted && d?.notifications) {
            setItems(d.notifications);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    };

    load();
    const interval = setInterval(load, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const unreadCount = items.filter((i) => !i.read).length;

  const markAllAsRead = async () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    await fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
  };

  const markSingleAsRead = async (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
    await fetch(`/api/notifications/${id}/read`, { method: "POST" }).catch(() => {});
  };

  const filteredItems = items.filter((item) => {
    if (filter === "UNREAD") return !item.read;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Department Notifications"
        description="Real-time alerts for queue dispatches, SLA breach risks, and citizen escalations."
        meta={<DemoBadge />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-xs"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              <span>Mark all as read</span>
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setFilter("ALL")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            filter === "ALL"
              ? "bg-primary text-white"
              : "text-muted hover:text-ink hover:bg-surface-muted"
          }`}
        >
          All ({items.length})
        </button>
        <button
          onClick={() => setFilter("UNREAD")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            filter === "UNREAD"
              ? "bg-primary text-white"
              : "text-muted hover:text-ink hover:bg-surface-muted"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-md border border-border bg-surface p-12">
          <EmptyState
            title={filter === "UNREAD" ? "No unread alerts" : "No notifications"}
            body="Department queue alerts and critical SLA warning triggers will appear here in real time."
          />
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface shadow-xs">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-start justify-between gap-4 p-4 transition-colors ${
                !item.read ? "bg-primary/5" : "hover:bg-surface-muted/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full p-1.5 bg-primary/10 text-primary">
                  {item.type === "RESOLVED" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  ) : item.type === "STATUS_CHANGED" ? (
                    <Clock className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{item.title}</span>
                    {!item.read && (
                      <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread notification" />
                    )}
                  </div>
                  <p className="text-xs text-muted leading-relaxed max-w-xl">{item.body}</p>
                  <span className="text-[11px] font-mono text-muted">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.link && (
                  <Button asChild variant="outline" size="sm" className="text-xs h-7 px-2.5">
                    <Link href={item.link.replace("/citizen/", "/authority/")}>Inspect</Link>
                  </Button>
                )}
                {!item.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markSingleAsRead(item.id)}
                    className="text-xs h-7 px-2 text-muted hover:text-ink"
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
