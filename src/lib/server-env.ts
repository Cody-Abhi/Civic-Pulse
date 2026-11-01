import "server-only";
import { z } from "zod";

/**
 * Server-only secrets (§40). Validated lazily and cached: importing this module
 * never throws, but the first access without required runtime credentials fails
 * fast with a clear, aggregated message.
 */
const boolish = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined ? def : v === "true" || v === "1"));

const serverSchema = z.object({
  APP_URL: z.url().default("http://localhost:3000"),
  DEMO_MODE: boolish(true),

  FIREBASE_ADMIN_PROJECT_ID: z.string().min(1),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.email(),
  FIREBASE_ADMIN_PRIVATE_KEY: z
    .string()
    .min(1)
    .transform((k) => k.replace(/\\n/g, "\n")),
  SESSION_COOKIE_NAME: z.string().min(1).default("__session"),
  SESSION_MAX_AGE_DAYS: z.coerce.number().int().positive().default(5),

  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL_PRIMARY: z.string().min(1).default("gemini-3.8-flash"),
  GEMINI_MODEL_FALLBACK: z.string().min(1).default("gemini-3.5-flash-lite"),
  GEMINI_MODEL_EMBEDDING: z.string().min(1).default("gemini-embedding-001"),
  AI_MODE: z.enum(["live", "stub"]).default("live"),
  ANALYSIS_TOKEN_SECRET: z.string().min(32),

  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  GEOCODER_BASE_URL: z.url().default("https://nominatim.openstreetmap.org"),
  GEOCODER_CONTACT_EMAIL: z.string().optional(),

  DEMO_CITIZEN_EMAIL: z.email().default("citizen@demo.civicpulse.invalid"),
  DEMO_AUTHORITY_EMAIL: z.email().default("roads@demo.civicpulse.invalid"),
  DEMO_ADMIN_EMAIL: z.email().default("admin@demo.civicpulse.invalid"),
  DEMO_PASSWORD: z.string().optional(),

  FEATURE_UPLOADS: boolish(false),
  FEATURE_PUSH: boolish(false),
  FEATURE_REVERSE_GEOCODE: boolish(false),
  FEATURE_APP_CHECK: boolish(false),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse({
    APP_URL: process.env.APP_URL,
    DEMO_MODE: process.env.DEMO_MODE,
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
