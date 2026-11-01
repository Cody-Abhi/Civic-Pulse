"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Bell, CheckCircle2, MessageSquare, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DemoBadge } from "@/components/ui/demo-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";

interface NotificationItem {
  id: string;
  type: "RESOLVED" | "SUPPORT_ADDED" | "STATUS_CHANGED" | "REOPENED";
  title: string;
  body: string;
  time: string;
  link: string;
  read: boolean;
  group: "Today" | "Yesterday" | "Earlier";
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "RESOLVED",
    title: "Complaint marked resolved",
    body: "Roads Department marked CP-BLR-2611-000007 as resolved. Please verify on ground.",
    time: "2 hours ago",
    link: "/citizen/complaints/synthetic-000007",
    read: false,
    group: "Today",
  },
  {
    id: "notif-2",
    type: "SUPPORT_ADDED",
    title: "3 neighbors added their voice",
    body: "Citizens in Bellandur supported your streetlight report CP-BLR-2611-000014.",
    time: "4 hours ago",
    link: "/citizen/complaints/synthetic-000014",
    read: false,
    group: "Today",
  },
  {
    id: "notif-3",
    type: "STATUS_CHANGED",
    title: "Investigation underway",
    body: "BBMP Solid Waste management assigned an inspection crew to CP-BLR-2611-000021.",
    time: "Yesterday",
    link: "/citizen/complaints/synthetic-000021",
    read: true,
    group: "Yesterday",
  },
  {
    id: "notif-4",
    type: "SUPPORT_ADDED",
    title: "Neighbor added their voice",
    body: "Citizen 4 supported your drainage overflow report CP-BLR-2611-000028.",
    time: "3 days ago",
    link: "/citizen/complaints/synthetic-000028",
    read: true,
    group: "Earlier",
  },
];

export default function CitizenNotificationsPage() {
  const [items, setItems] = React.useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = React.useState<"ALL" | "UNREAD">("ALL");

  const unreadCount = items.filter((i) => !i.read).length;

  const markAllAsRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const markSingleAsRead = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
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
            disabled={unreadCount === 0}
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

      {filteredItems.length === 0 ? (
        <div className="rounded-md border border-border bg-surface p-12">
          <EmptyState
            title="You're all caught up"
            body="No unread municipal notifications at this time."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => {
            const groupItems = filteredItems.filter((i) => i.group === group);
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
                          <span className="text-xs text-muted">{item.time}</span>
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
