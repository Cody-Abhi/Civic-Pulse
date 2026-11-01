import { NextResponse } from "next/server";
import { withApi, ApiError } from "@/server/http/with-api";
import { getAdminFirestore } from "@/server/clients/firebase-admin";
import type { Complaint, ComplaintActivity } from "@/domain/types";
import { z } from "zod";

export const runtime = "nodejs";

const addNoteSchema = z.object({
  note: z.string().min(1).max(1000),
  visibleToReporter: z.boolean().default(false),
});

type AddNoteInput = z.infer<typeof addNoteSchema>;

export const POST = withApi<AddNoteInput, { id: string }>(
  {
    schema: addNoteSchema,
    roles: ["authority", "admin"],
  },
  async (_req, { user, body, params }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
    }

    const { id } = await params;
    const firestore = getAdminFirestore();

    const docRef = firestore.collection("complaints").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      throw new ApiError(404, "NOT_FOUND", "Complaint not found");
    }

    const complaint = snap.data() as Complaint;

    // Department boundary check
    if (user.role === "authority" && user.departmentId !== complaint.departmentId) {
      throw new ApiError(404, "NOT_FOUND", "Complaint not found in your assigned department");
    }

    const nowIso = new Date().toISOString();
    const activityId = crypto.randomUUID();

    const activity: ComplaintActivity = {
      id: activityId,
      complaintId: complaint.id,
      actorUid: user.uid,
      actorName: user.displayName,
      actorRole: user.role,
      action: "NOTE_ADDED",
      note: body.note,
      createdAt: nowIso,
      visibleToReporter: body.visibleToReporter,
      departmentId: complaint.departmentId,
    };

    await firestore.collection("complaintActivities").doc(activityId).set(activity);
    await docRef.update({ updatedAt: nowIso });

    return NextResponse.json({ success: true, activity }, { status: 201 });
  },
);

