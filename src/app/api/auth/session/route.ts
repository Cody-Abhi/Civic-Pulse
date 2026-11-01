import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSessionCookie, getSessionUser } from "@/server/auth/session";
import { getRoleHome } from "@/server/auth/require-role";
import { getServerEnv } from "@/lib/server-env";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let tokenOrEmail = body.idToken || (body.demoEmail ? `demo:${body.demoEmail}` : null);
    if (!tokenOrEmail && body.demoRole) {
      const env = getServerEnv();
      const email =
        body.demoRole === "admin"
          ? env.DEMO_ADMIN_EMAIL
          : body.demoRole === "authority"
            ? env.DEMO_AUTHORITY_EMAIL
            : env.DEMO_CITIZEN_EMAIL;
      tokenOrEmail = `demo:${email}`;
    }

    if (!tokenOrEmail) {
      return NextResponse.json(
        { error: "Missing authentication credential (idToken, demoEmail or demoRole required)" },
        { status: 400 },
      );
    }

    const { user, cookieValue, maxAgeSeconds } = await createSessionCookie(tokenOrEmail);
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

    return NextResponse.json({
      ok: true,
      role: user.role,
      home: getRoleHome(user.role),
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        departmentId: user.departmentId,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to establish session";
    return NextResponse.json({ error: message }, { status: 401 });
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
