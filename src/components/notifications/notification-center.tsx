"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, Clock, Loader2, Check, ShieldAlert, Bell } from "lucide-react";
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

export interface NotificationCenterProps {
  title: string;
  description: string;
  role: "citizen" | "authority" | "admin";
  emptyTitle?: string;
  emptyBody?: string;
}

export function NotificationCenter({
  title,
  description,
  role,
  emptyTitle,
  emptyBody,
}: NotificationCenterProps) {
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
        title={title}
        description={description}
        meta={<DemoBadge />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-xs min-h-[36px]"
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
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors min-h-[32px] ${
            filter === "ALL"
              ? "bg-primary text-white"
              : "border border-border bg-surface text-muted hover:bg-sunken hover:text-ink"
          }`}
        >
          All alerts ({items.length})
        </button>
        <button
          onClick={() => setFilter("UNREAD")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors min-h-[32px] ${
            filter === "UNREAD"
              ? "bg-primary text-white"
              : "border border-border bg-surface text-muted hover:bg-sunken hover:text-ink"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted">
          <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
          <span className="text-sm">Loading alerts...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={filter === "UNREAD" ? CheckCircle2 : role === "admin" ? ShieldAlert : Bell}
          title={
            emptyTitle || (filter === "UNREAD" ? "No unread alerts" : "No alerts")
          }
          body={
            emptyBody ||
            (filter === "UNREAD"
              ? "All notifications have been marked as read."
              : "You are up to date! New updates and notifications will appear here.")
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors ${
                item.read ? "border-border bg-surface" : "border-primary/40 bg-primary-subtle/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full p-1.5 bg-sunken text-muted shrink-0">
                  {item.type === "STATUS_CHANGED" ? (
                    <Clock className="h-4 w-4 text-warning" />
                  ) : item.type === "SLA_BREACH" ? (
                    <AlertTriangle className="h-4 w-4 text-primary" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-ink-secondary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-ink">{item.title}</h4>
                    {!item.read && (
                      <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted leading-relaxed">{item.body}</p>
                  <div className="mt-2.5 flex items-center gap-4 text-[11px] text-muted">
                    <span>{formatRelativeTime(item.createdAt)}</span>
                    {item.link && (
                      <Link
                        href={item.link}
                        onClick={() => markSingleAsRead(item.id)}
                        className="font-medium text-primary hover:underline"
                      >
                        View details →
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {!item.read && (
                <button
                  onClick={() => markSingleAsRead(item.id)}
                  className="rounded p-1 text-muted hover:bg-sunken hover:text-ink shrink-0"
                  title="Mark as read"
                  aria-label="Mark notification as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

