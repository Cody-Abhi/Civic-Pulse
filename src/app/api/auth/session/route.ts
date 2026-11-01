import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSessionCookie, getSessionUser } from "@/server/auth/session";
import { getRoleHome } from "@/server/auth/require-role";
import { getServerEnv } from "@/lib/server-env";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const idToken = body.idToken;
    const next = body.next;
    const homeWardId = body.homeWardId;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_FAILED",
            message: "Missing or invalid idToken in request body",
          },
        },
        { status: 400 },
      );
    }

    const { user, cookieValue, maxAgeSeconds } = await createSessionCookie(idToken);
    
    // If homeWardId was provided during registration and user hasn't set one yet
    if (homeWardId && typeof homeWardId === "string" && !user.homeWardId) {
      try {
        const { getAdminFirestore } = await import("@/server/clients/firebase-admin");
        const firestore = getAdminFirestore();
        await firestore.collection("users").doc(user.uid).update({
          homeWardId,
          updatedAt: new Date().toISOString(),
        });
        user.homeWardId = homeWardId;
      } catch {
        // Non-blocking update failure
      }
    }

    const env = getServerEnv();
    const cookieStore = await cookies();

    cookieStore.set({
      name: env.SESSION_COOKIE_NAME,
      value: cookieValue,
      maxAge: maxAgeSeconds,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    // Validate next redirect to prevent open-redirect attacks (§UI-03 acceptance)
    let destination = getRoleHome(user.role);
    if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.includes(":")) {
      destination = next;
    }

    return NextResponse.json({
      ok: true,
      role: user.role,
      home: destination,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        departmentId: user.departmentId,
        homeWardId: user.homeWardId,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "ACCOUNT_SUSPENDED") {
      return NextResponse.json(
        {
          error: {
            code: "ACCOUNT_SUSPENDED",
            message: "Your account has been suspended.",
          },
        },
        { status: 403 },
      );
    }
    const message = err instanceof Error ? err.message : "Failed to establish session";
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message,
        },
      },
      { status: 401 },
    );
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({
    user: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      departmentId: user.departmentId,
      homeWardId: user.homeWardId,
    },
    home: getRoleHome(user.role),
  });
}

export async function DELETE() {
  const env = getServerEnv();
  const cookieStore = await cookies();
  cookieStore.delete(env.SESSION_COOKIE_NAME);

  return NextResponse.json({ ok: true });
}
