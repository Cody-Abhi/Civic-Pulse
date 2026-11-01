import { withApi, ApiError } from "@/server/http/with-api";
import { getAdminFirestore } from "@/server/clients/firebase-admin";
import type { Complaint, Notification } from "@/domain/types";

export const runtime = "nodejs";

export const GET = withApi(
  {},
  async (_req, { user }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
    }

    const firestore = getAdminFirestore();

    const [userDoc, complaintsSnap, notifsSnap] = await Promise.all([
      firestore.collection("users").doc(user.uid).get(),
      firestore.collection("complaints").where("reporterUid", "==", user.uid).get(),
      firestore.collection("notifications").where("userId", "==", user.uid).get(),
    ]);

    const complaints = complaintsSnap.docs.map((d) => d.data() as Complaint);
    const notifications = notifsSnap.docs.map((d) => d.data() as Notification);

    const exportPayload = {
      profile: userDoc.data() || {},
      complaints,
      notifications,
      exportedAt: new Date().toISOString(),
      disclaimer: "CivicPulse AI data export · Independent prototype · Not affiliated with any government body",
    };

    return new Response(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="civicpulse-data-export-${user.uid}.json"`,
      },
    });
  },
);
