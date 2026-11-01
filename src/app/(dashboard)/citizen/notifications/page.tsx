"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Bell, CheckCircle2, MessageSquare, RotateCcw, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoBadge } from "@/components/ui/demo-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import type { Notification } from "@/domain/types";

function getNotificationGroup(createdAtIso: string): "Today" | "Yesterday" | "Earlier" {
  const date = new Date(createdAtIso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return "Earlier";
}

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

export default function CitizenNotificationsPage() {
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
    const interval = setInterval(load, 10000);
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

  const groups = ["Today", "Yesterday", "Earlier"] as const;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Notifications"
        description="Stay informed about department actions, neighbor support, and resolution verification milestones."
        meta={<DemoBadge />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || loading}
            className="gap-1.5"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            <span>Mark all as read</span>
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setFilter("ALL")}
          className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            filter === "ALL"
              ? "bg-primary text-white"
              : "bg-surface text-ink-muted hover:bg-surface-muted hover:text-ink"
          }`}
        >
          All alerts ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("UNREAD")}
          className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            filter === "UNREAD"
              ? "bg-primary text-white"
              : "bg-surface text-ink-muted hover:bg-surface-muted hover:text-ink"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-md border border-border bg-surface text-muted text-sm gap-2">
          <Loader2 size={18} className="animate-spin text-primary" />
          <span>Loading notifications...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-md border border-border bg-surface p-12">
          <EmptyState
            title="You're all caught up"
            body="No unread municipal notifications at this time."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => {
            const groupItems = filteredItems.filter((i) => getNotificationGroup(i.createdAt) === group);
            if (groupItems.length === 0) return null;

            return (
              <section key={group} className="flex flex-col gap-2.5">
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wider px-1">
                  {group}
                </h2>
                <div className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface shadow-xs">
                  {groupItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.link}
                      onClick={() => markSingleAsRead(item.id)}
                      className={`group flex items-start gap-4 p-4 transition-colors hover:bg-surface-muted/50 ${
                        !item.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.type === "RESOLVED" && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/15 text-success">
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          </div>
                        )}
                        {item.type === "SUPPORT_ADDED" && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                            <MessageSquare className="h-4 w-4" aria-hidden="true" />
                          </div>
                        )}
                        {item.type === "STATUS_CHANGED" && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent">
                            <Bell className="h-4 w-4" aria-hidden="true" />
                          </div>
                        )}
                        {item.type === "REOPENED" && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/15 text-warning">
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <h3
                            className={`text-sm ${
                              !item.read ? "font-bold text-ink" : "font-medium text-ink"
                            }`}
                          >
                            {item.title}
                          </h3>
                          <span className="text-xs text-muted">{formatRelativeTime(item.createdAt)}</span>
                        </div>
                        <p className="text-xs text-ink-muted leading-relaxed">{item.body}</p>
                      </div>

                      {!item.read && (
                        <span
                          className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0"
                          title="Unread notification"
                        />
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
