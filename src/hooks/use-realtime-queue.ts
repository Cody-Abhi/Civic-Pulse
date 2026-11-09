"use client";

import * as React from "react";
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase";
import { isFirebaseClientConfigured } from "@/lib/env";
import type { Complaint } from "@/domain/types";

export interface UseRealtimeQueueResult {
  complaints: Complaint[];
  isLive: boolean;
  error: Error | null;
}

/**
 * Real-time authority queue listener (PRD §23.4, Block C).
 * Department-scoped query: complaints where departmentId == currentDepartment, limit 20.
 * Shows subtle Live state; unsubscribes on unmount.
 */
export function useRealtimeQueue(
  initialComplaints: Complaint[],
  departmentId?: string | null,
): UseRealtimeQueueResult {
  const [complaints, setComplaints] = React.useState<Complaint[]>(initialComplaints);
  const [isLive, setIsLive] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!isFirebaseClientConfigured() || !departmentId || departmentId === "ALL") {
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

        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }

        if (!user) {
          setIsLive(false);
          return;
        }

        try {
          // Department-scoped query, limit 20 (PRD §23.4, Block C)
          const q = query(
            collection(db, "complaints"),
            where("departmentId", "==", departmentId),
            limit(20),
          );

          unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              if (!isMounted) return;
              const items: Complaint[] = [];
              snapshot.forEach((doc) => {
                items.push({ ...(doc.data() as Complaint), id: doc.id });
              });

              if (items.length > 0) {
                setComplaints((prev) => {
                  // Merge live snapshot items with remaining initial items beyond limit 20
                  const liveIds = new Set(items.map((i) => i.id));
                  const remaining = prev.filter((p) => !liveIds.has(p.id));
                  return [...items, ...remaining];
                });
              }
              setIsLive(true);
              setError(null);
            },
            (err) => {
              if (!isMounted) return;
              console.warn("[useRealtimeQueue] snapshot fallback:", err.message);
              setIsLive(false);
              setError(err);
            },
          );
        } catch (err) {
          if (!isMounted) return;
          setIsLive(false);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      });
    } catch (err) {
      queueMicrotask(() => {
        if (!isMounted) return;
        setIsLive(false);
        setError(err instanceof Error ? err : new Error(String(err)));
      });
    }

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      if (authUnsubscribe) authUnsubscribe();
    };
  }, [departmentId]);

  return {
    complaints,
    isLive,
    error,
  };
}
