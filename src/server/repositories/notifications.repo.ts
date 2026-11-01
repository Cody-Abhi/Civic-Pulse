import "server-only";
import { getAdminFirestore } from "@/server/clients/firebase-admin";
import type { Notification, NotificationType } from "@/domain/types";

export interface CreateNotificationInput {
  userId: string;
  complaintId?: string | null | undefined;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
}

/**
 * Creates an in-app notification and increments the recipient's unread counter (§32.1).
 */
export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  const firestore = getAdminFirestore();
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const nowIso = new Date().toISOString();

  const notification: Notification = {
    id,
    userId: input.userId,
    complaintId: input.complaintId || null,
    type: input.type,
    title: input.title,
    body: input.body.slice(0, 160),
    link: input.link,
    read: false,
    createdAt: nowIso,
  };

  const notifRef = firestore.collection("notifications").doc(id);
  const userRef = firestore.collection("users").doc(input.userId);

  await firestore.runTransaction(async (tx) => {
    const userDoc = await tx.get(userRef);

    tx.set(notifRef, notification);

    if (userDoc.exists) {
      const currentUnread = (userDoc.data()?.unreadNotifications as number) || 0;
      tx.update(userRef, {
        unreadNotifications: currentUnread + 1,
        updatedAt: nowIso,
      });
    }
  });

  return notification;
}

/**
 * Lists notifications for a given user, newest first.
 */
export async function listUserNotifications(
  userId: string,
  limitCount = 50,
): Promise<{ notifications: Notification[]; unreadCount: number }> {
  const firestore = getAdminFirestore();
  const snapshot = await firestore
    .collection("notifications")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(limitCount)
    .get();

  const notifications = snapshot.docs.map((doc) => doc.data() as Notification);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount };
}

/**
 * Marks a single notification as read and decrements the unread count (PRD §32.1).
 */
export async function markNotificationRead(
  notificationId: string,
  userId: string,
): Promise<{ success: boolean; unreadCount: number }> {
  const firestore = getAdminFirestore();
  const notifRef = firestore.collection("notifications").doc(notificationId);
  const userRef = firestore.collection("users").doc(userId);

  return firestore.runTransaction(async (tx) => {
    const notifDoc = await tx.get(notifRef);
    if (!notifDoc.exists) {
      return { success: false, unreadCount: 0 };
    }

    const data = notifDoc.data() as Notification;
    if (data.userId !== userId) {
      return { success: false, unreadCount: 0 };
    }

    const userDoc = await tx.get(userRef);
    const currentUnread = (userDoc.data()?.unreadNotifications as number) || 0;
    let nextUnread = currentUnread;

    if (!data.read) {
      tx.update(notifRef, { read: true });
      nextUnread = Math.max(0, currentUnread - 1);
      if (userDoc.exists) {
        tx.update(userRef, {
          unreadNotifications: nextUnread,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return { success: true, unreadCount: nextUnread };
  });
}

/**
 * Marks all notifications for a user as read and sets unread counter to 0 (§32.1).
 */
export async function markAllNotificationsRead(userId: string): Promise<{ success: boolean }> {
  const firestore = getAdminFirestore();
  const unreadSnapshot = await firestore
    .collection("notifications")
    .where("userId", "==", userId)
    .where("read", "==", false)
    .get();

  const batch = firestore.batch();
  for (const doc of unreadSnapshot.docs) {
    batch.update(doc.ref, { read: true });
  }

  const userRef = firestore.collection("users").doc(userId);
  batch.update(userRef, {
    unreadNotifications: 0,
    updatedAt: new Date().toISOString(),
  });

  await batch.commit();
  return { success: true };
}
