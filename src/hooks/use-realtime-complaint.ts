"use client";

import * as React from "react";
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase";
import { isFirebaseClientConfigured } from "@/lib/env";
import type { Complaint, ComplaintActivity } from "@/domain/types";

export interface UseRealtimeComplaintResult {
  complaint: Complaint | null;
  activities: ComplaintActivity[];
  isLive: boolean;
  error: Error | null;
}

/**
 * Real-time citizen/authority complaint detail listener (PRD §23.4, Block C).
 * Listens to complaints/{id} and complaintActivities.
 * Shows subtle Live state; unsubscribes on unmount.
 */
export function useRealtimeComplaint(
  initialComplaint: Complaint,
): UseRealtimeComplaintResult {
  const [complaint, setComplaint] = React.useState<Complaint>(initialComplaint);
  const [activities, setActivities] = React.useState<ComplaintActivity[]>([]);
  const [isLive, setIsLive] = React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!isFirebaseClientConfigured() || !initialComplaint?.id) {
      return;
    }

    let unsubDoc: Unsubscribe | null = null;
    let unsubActivities: Unsubscribe | null = null;
    let authUnsubscribe: (() => void) | null = null;
    let isMounted = true;

    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseFirestore();

      authUnsubscribe = auth.onAuthStateChanged((user) => {
        if (!isMounted) return;

        // Clean up previous listeners
        if (unsubDoc) {
          unsubDoc();
          unsubDoc = null;
        }
        if (unsubActivities) {
          unsubActivities();
          unsubActivities = null;
        }

        if (!user) {
          setIsLive(false);
          return;
        }

        try {
          // 1. Complaint document listener
          const complaintRef = doc(db, "complaints", initialComplaint.id);
          unsubDoc = onSnapshot(
            complaintRef,
            (snapshot) => {
              if (!isMounted) return;
              if (snapshot.exists()) {
                const data = snapshot.data() as Complaint;
                setComplaint((prev) => ({ ...prev, ...data, id: snapshot.id }));
                setIsLive(true);
                setError(null);
              }
            },
            (err) => {
              if (!isMounted) return;
              console.warn("[useRealtimeComplaint] doc snapshot error:", err.message);
              setIsLive(false);
              setError(err);
            },
          );

          // 2. Complaint activities listener
          const actQuery = query(
            collection(db, "complaintActivities"),
            where("complaintId", "==", initialComplaint.id),
            where("visibleToReporter", "==", true),
            orderBy("createdAt", "asc"),
          );

          unsubActivities = onSnapshot(
            actQuery,
            (snapshot) => {
              if (!isMounted) return;
              const acts: ComplaintActivity[] = [];
              snapshot.forEach((d) => {
                acts.push({ ...(d.data() as ComplaintActivity), id: d.id });
              });
              setActivities(acts);
            },
            (err) => {
              if (!isMounted) return;
              // Silently log activity snapshot error (may require specific index or role)
              console.warn("[useRealtimeComplaint] activities snapshot error:", err.message);
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
      if (unsubDoc) unsubDoc();
      if (unsubActivities) unsubActivities();
      if (authUnsubscribe) authUnsubscribe();
    };
  }, [initialComplaint?.id]);

  return {
    complaint,
    activities,
    isLive,
    error,
  };
}
