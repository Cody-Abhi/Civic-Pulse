"use client";

import * as React from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase";
import { isFirebaseClientConfigured } from "@/lib/env";
import type { Notification } from "@/domain/types";

export interface UseRealtimeNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  isLive: boolean;
  loading: boolean;
  error: Error | null;
}

/**
 * Real-time notification listener (PRD §23.4, Block C).
 * Scoped query: notifications where userId == uid, ordered by createdAt desc.
 * Shows subtle Live state; unsubscribes on unmount.
 */
export function useRealtimeNotifications(): UseRealtimeNotificationsResult {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [isLive, setIsLive] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(() => isFirebaseClientConfigured());
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!isFirebaseClientConfigured()) {
      return;
    }

    let unsubscribe: Unsubscribe | null = null;
    let authUnsubscribe: (() => void) | null = null;
    let isMounted = true;

    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseFirestore();

      authUnsubscribe = auth.onAuthStateChanged((user) => {
        if (!isMounted) return;

        // Clean up previous snapshot listener on auth change
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
          setIsLive(false);
        }

        if (!user) {
          setNotifications([]);
          setUnreadCount(0);
          setLoading(false);
          setIsLive(false);
          return;
        }

        try {
          const q = query(
            collection(db, "notifications"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(50),
          );

          unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              if (!isMounted) return;
              const items: Notification[] = [];
              let unread = 0;

              snapshot.forEach((doc) => {
                const data = doc.data() as Notification;
                items.push({ ...data, id: doc.id });
                if (!data.read) unread += 1;
              });

              setNotifications(items);
              setUnreadCount(unread);
              setIsLive(true);
              setLoading(false);
              setError(null);
            },
            (err) => {
              if (!isMounted) return;
              console.warn("[useRealtimeNotifications] Firestore onSnapshot fallback:", err.message);
              setIsLive(false);
              setError(err);
              setLoading(false);
            },
          );
        } catch (err) {
          if (!isMounted) return;
          setIsLive(false);
          setLoading(false);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      });
    } catch (err) {
      queueMicrotask(() => {
        if (!isMounted) return;
        setIsLive(false);
        setLoading(false);
        setError(err instanceof Error ? err : new Error(String(err)));
      });
    }

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      if (authUnsubscribe) authUnsubscribe();
    };
  }, []);

  return {
    notifications,
    unreadCount,
    isLive,
    loading,
    error,
  };
}
