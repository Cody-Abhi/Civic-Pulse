import { type NextRequest } from "next/server";
import { proxyMiddleware } from "./middleware/proxy";

export function proxy(request: NextRequest) {
  return proxyMiddleware(request);
}

export const config = {
  matcher: [
    "/citizen/:path*",
    "/authority/:path*",
    "/admin/:path*",
  ],
};

