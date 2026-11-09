import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { type z } from "zod";
import type { Role } from "@/domain/schemas";
import { getSessionUser, type SessionUser } from "@/server/auth/session";
import { getServerEnv } from "@/lib/server-env";

function getReqUrl(req: NextRequest | Request): URL {
  if ("nextUrl" in req && req.nextUrl) {
    return req.nextUrl;
  }
  return new URL(req.url, "http://localhost:3000");
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface WithApiOptions<TBody = unknown> {
  /** If true, authentication is not required. Default: false */
  public?: boolean;
  /** Allowed user roles. If omitted and public is false, any active authenticated user is allowed */
  roles?: Role[];
  /** Optional custom authorization check */
  authorize?: (
    user: SessionUser,
    req: NextRequest,
    context: { params?: Promise<Record<string, string>> | Record<string, string> },
  ) => boolean | Promise<boolean>;
  /** Optional Zod schema to parse and validate request body */
  schema?: z.ZodType<TBody>;
  /** Optional rate limit tag */
  rateLimit?: { key: string; limit: number; windowSec: number };
}

export interface ApiHandlerContext<TBody = unknown, TParams = Record<string, string>> {
  user: SessionUser | null;
  body: TBody;
  params: TParams;
  requestId: string;
}

export type ApiHandler<TBody = unknown, TParams = Record<string, string>> = (
  req: NextRequest,
  context: ApiHandlerContext<TBody, TParams>,
) => Promise<NextResponse | Response>;

/**
 * Standard HTTP Route Handler Wrapper (PRD §21.1, §21.2, §21.3).
 * Enforces authentication, role checks, origin checks on mutations,
 * body schema validation, structured logging, and PRD error envelope.
 */
export function withApi<TBody = unknown, TParams = Record<string, string>>(
  options: WithApiOptions<TBody>,
  handler: ApiHandler<TBody, TParams>,
) {
  return async (
    req: NextRequest,
    rawContext?: { params?: Promise<TParams> | TParams },
  ): Promise<NextResponse | Response> => {
    const startedAt = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Resolve route parameters if provided
    let params: TParams = {} as TParams;
    if (rawContext?.params) {
      params = (rawContext.params instanceof Promise
        ? await rawContext.params
        : rawContext.params) as TParams;
    }

    let user: SessionUser | null = null;

    try {
      // 1. Origin verification for state-changing requests (§21.1)
      const method = req.method.toUpperCase();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        const origin = req.headers.get("origin");
        if (origin) {
          const env = getServerEnv();
          const host = req.headers.get("host") || "";
          const allowedOrigins = [
            env.APP_URL,
            `http://${host}`,
            `https://${host}`,
            getReqUrl(req).origin,
          ].filter(Boolean);

          const isAllowed = allowedOrigins.some(
            (allowed) => origin === allowed || origin.replace(/\/$/, "") === allowed?.replace(/\/$/, ""),
          );

          if (!isAllowed) {
            return formatErrorResponse(
              403,
              "ORIGIN_MISMATCH",
              "Origin header mismatch.",
              { origin, expected: env.APP_URL },
              requestId,
            );
          }
        }
      }

      // 2. Authentication and Authorization checks
      if (!options.public) {
        user = await getSessionUser();

        if (!user) {
          return formatErrorResponse(
            401,
            "UNAUTHENTICATED",
            "Authentication required.",
            undefined,
            requestId,
          );
        }

        if (user.status === "suspended") {
          return formatErrorResponse(
            403,
            "ACCOUNT_SUSPENDED",
            "This account is suspended.",
            undefined,
            requestId,
          );
        }

        if (options.roles && !options.roles.includes(user.role)) {
          return formatErrorResponse(
            403,
            "FORBIDDEN",
            `Role '${user.role}' is not authorized to access this resource.`,
            undefined,
            requestId,
          );
        }

        // View-only demo account guard for mutating endpoints (Block D: Judge Mode)
        const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
        if (user.viewOnly && isMutation) {
          return formatErrorResponse(
            403,
            "FORBIDDEN",
            "View-only demo account",
            undefined,
            requestId,
          );
        }

        if (options.authorize) {
          const authorized = await options.authorize(user, req, { params: rawContext?.params as Promise<Record<string, string>> });
          if (!authorized) {
            return formatErrorResponse(
              403,
              "FORBIDDEN",
              "Access denied by authorization policy.",
              undefined,
              requestId,
            );
          }
        }
      }

      // 3. Request body parsing and Zod schema validation
      let body: TBody = undefined as TBody;
      if (["POST", "PUT", "PATCH"].includes(method)) {
        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const text = await req.text();
          if (text && text.trim().length > 0) {
            if (text.length > 64 * 1024) {
              return formatErrorResponse(
                400,
                "VALIDATION_FAILED",
                "Request body exceeds 64 KB limit.",
                undefined,
                requestId,
              );
            }
            try {
              body = JSON.parse(text) as TBody;
            } catch {
              return formatErrorResponse(
                400,
                "VALIDATION_FAILED",
                "Malformed JSON in request body.",
                undefined,
                requestId,
              );
            }
          }
        }

        if (options.schema) {
          const parsed = options.schema.safeParse(body);
          if (!parsed.success) {
            return formatErrorResponse(
              400,
              "VALIDATION_FAILED",
              "Validation failed.",
              parsed.error.issues,
              requestId,
            );
          }
          body = parsed.data;
        }
      }

      // 4. Execute the API handler
      const response = await handler(req, {
        user,
        body,
        params,
        requestId,
      });

      // Append standard trace headers
      response.headers.set("x-request-id", requestId);

      // Structured logging (§21.3)
      logRequest({
        ts: new Date().toISOString(),
        requestId,
        route: getReqUrl(req).pathname,
        method: req.method,
        uid: user?.uid,
        role: user?.role,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });

      return response;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        logRequest({
          ts: new Date().toISOString(),
          requestId,
          route: getReqUrl(req).pathname,
          method: req.method,
          uid: user?.uid,
          role: user?.role,
          status: err.status,
          durationMs: Date.now() - startedAt,
          code: err.code,
        });

        return formatErrorResponse(
          err.status,
          err.code,
          err.message,
          err.details,
          requestId,
        );
      }

      if (
        err &&
        typeof err === "object" &&
        "status" in err &&
        typeof (err as { status: unknown }).status === "number" &&
        "code" in err &&
        typeof (err as { code: unknown }).code === "string"
      ) {
        const custom = err as { status: number; code: string; message: string; details?: unknown };
        logRequest({
          ts: new Date().toISOString(),
          requestId,
          route: getReqUrl(req).pathname,
          method: req.method,
          uid: user?.uid,
          role: user?.role,
          status: custom.status,
          durationMs: Date.now() - startedAt,
          code: custom.code,
        });

        return formatErrorResponse(
          custom.status,
          custom.code,
          custom.message,
          custom.details,
          requestId,
        );
      }

      const message = err instanceof Error ? err.message : "Internal server error";
      logRequest({
        ts: new Date().toISOString(),
        requestId,
        route: getReqUrl(req).pathname,
        method: req.method,
        uid: user?.uid,
        role: user?.role,
        status: 500,
        durationMs: Date.now() - startedAt,
        code: "INTERNAL",
      });

      return formatErrorResponse(
        500,
        "INTERNAL",
        process.env.NODE_ENV === "production" ? "Internal server error" : message,
        undefined,
        requestId,
      );
    }
  };
}

function formatErrorResponse(
  status: number,
  code: string,
  message: string,
  details: unknown,
  requestId: string,
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        requestId,
      },
    },
    {
      status,
      headers: {
        "x-request-id": requestId,
        "content-type": "application/json",
      },
    },
  );
}

function logRequest(entry: {
  ts: string;
  requestId: string;
  route: string;
  method: string;
  uid?: string | undefined;
  role?: string | undefined;
  status: number;
  durationMs: number;
  code?: string | undefined;
}) {
  // Free tier structured logging (§21.3) - never logs PII, passwords, or tokens
  console.warn(JSON.stringify(entry));
}
