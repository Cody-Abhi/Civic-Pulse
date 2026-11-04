import "server-only";
import { z } from "zod";
import { serverEnvSchema, type ServerEnv } from "./env-schema";

export type { ServerEnv } from "./env-schema";

let cached: ServerEnv | null = null;

/**
 * Server-only secrets (§40). Validated lazily and cached: importing this module
 * never throws, but the first access without required runtime credentials fails
 * fast with a clear, aggregated message.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse({
    APP_URL: process.env.APP_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    DEMO_MODE: process.env.DEMO_MODE,
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
    FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID,
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
    SESSION_MAX_AGE_DAYS: process.env.SESSION_MAX_AGE_DAYS,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL_PRIMARY: process.env.GEMINI_MODEL_PRIMARY,
    GEMINI_MODEL_FALLBACK: process.env.GEMINI_MODEL_FALLBACK,
    GEMINI_MODEL_EMBEDDING: process.env.GEMINI_MODEL_EMBEDDING,
    AI_MODE: process.env.AI_MODE,
    ANALYSIS_TOKEN_SECRET: process.env.ANALYSIS_TOKEN_SECRET,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    GEOCODER_BASE_URL: process.env.GEOCODER_BASE_URL,
    GEOCODER_CONTACT_EMAIL: process.env.GEOCODER_CONTACT_EMAIL,
    DEMO_CITIZEN_EMAIL: process.env.DEMO_CITIZEN_EMAIL,
    DEMO_AUTHORITY_EMAIL: process.env.DEMO_AUTHORITY_EMAIL,
    DEMO_ADMIN_EMAIL: process.env.DEMO_ADMIN_EMAIL,
    DEMO_PASSWORD: process.env.DEMO_PASSWORD,
    DEMO_ADMIN_PASSWORD: process.env.DEMO_ADMIN_PASSWORD,
    CRON_SECRET: process.env.CRON_SECRET,
    FEATURE_UPLOADS: process.env.FEATURE_UPLOADS,
    FEATURE_PUSH: process.env.FEATURE_PUSH,
    FEATURE_REVERSE_GEOCODE: process.env.FEATURE_REVERSE_GEOCODE,
    FEATURE_APP_CHECK: process.env.FEATURE_APP_CHECK,
    NODE_ENV: process.env.NODE_ENV,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment — missing or malformed variables:\n${z.prettifyError(
        parsed.error,
      )}`,
    );
  }
  // AI stub must never run in production (§36, A.4).
  if (parsed.data.AI_MODE === "stub" && parsed.data.NODE_ENV === "production") {
    throw new Error("AI_MODE=stub is refused in production.");
  }
  cached = parsed.data;
  return cached;
}
