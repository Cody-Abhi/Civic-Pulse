import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/citizen", "/authority", "/admin"];

export function proxyMiddleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtected) {
    const cookieName = process.env.SESSION_COOKIE_NAME || "__session";
    const sessionCookie =
      request.cookies.get(cookieName)?.value ||
      request.cookies.get("__session")?.value ||
      request.cookies.get("cp_session")?.value;

    if (!sessionCookie || sessionCookie.trim().length === 0) {
      // Prevent open redirect by ensuring path starts with / and not // (PRD §36.1 T14)
      const targetPath = `${pathname}${search}`;
      const safeNext =
        targetPath.startsWith("/") && !targetPath.startsWith("//")
          ? targetPath
          : "/";

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", safeNext);

      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

