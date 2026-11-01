import { NextResponse } from "next/server";
import { withApi, ApiError } from "@/server/http/with-api";
import { getAdminFirestore } from "@/server/clients/firebase-admin";
import type { Complaint, MapSnapshotPoint } from "@/domain/types";

export const runtime = "nodejs";

const OPEN_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "REOPENED"];

export const GET = withApi(
  {
    roles: ["authority", "admin"],
  },
  async (req, { user }) => {
    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Authentication required");
    }

    const url = new URL(req.url);
    const queryDept = url.searchParams.get("departmentId");
    const targetDept = user.role === "authority" ? user.departmentId : queryDept || user.departmentId || "roads";

    if (!targetDept) {
      throw new ApiError(400, "BAD_REQUEST", "Department identifier is required");
    }

    const firestore = getAdminFirestore();
    const snapshot = await firestore
      .collection("complaints")
      .where("departmentId", "==", targetDept)
      .where("status", "in", OPEN_STATUSES)
      .limit(2000)
      .get();

    const points: MapSnapshotPoint[] = snapshot.docs.map((doc) => {
      const c = doc.data() as Complaint;
      return {
        id: c.id,
        ref: c.ref,
        lat: Number(c.location.lat.toFixed(5)),
        lng: Number(c.location.lng.toFixed(5)),
        category: c.category,
        band: c.priority.band,
        score: c.priority.score,
        status: c.status,
        supporters: c.supporterCount,
        isSynthetic: c.isSynthetic,
        title: c.title.slice(0, 40),
      };
    });

    return NextResponse.json(
      {
        departmentId: targetDept,
        count: points.length,
        points,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      },
    );
  },
);

