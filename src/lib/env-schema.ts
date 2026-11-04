import { z } from "zod";

/**
 * Shared environment schemas and utilities (§40).
 * This module contains NO "server-only" imports so it can be safely used
 * by runtime client, runtime server, build scripts, and CLI utilities.
 */

export const boolish = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined ? def : v === "true" || v === "1"));

/**
 * Normalizes multiline RSA private keys from environment variables.
 * Handles:
 * - Literal newlines and escaped `\n` characters
 * - Leading and trailing quotation marks (double or single)
 * - Leading and trailing whitespace
 *
 * Prevents Node crypto / Firebase Admin OpenSSL DECODER routines::unsupported errors.
 */
export function parsePrivateKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  let key = raw.trim();
  if (key.length === 0) return undefined;

  // Strip leading and trailing quotes (e.g. from Vercel or dotenv inputs)
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  // Replace escaped newlines with actual newlines and trim whitespace/trailing newlines
  key = key.replace(/\\n/g, "\n").trim();

  if (key.length === 0) return undefined;
  return key;
}

export const clientEnvSchema = z.object({
  APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  CITY_ID: z.string().min(1).default("blr"),
  CITY_NAME: z.string().min(1).default("Bengaluru"),
  DEMO_MODE: boolish(true),
  NEXT_PUBLIC_DEMO_MODE: boolish(true),
  FIREBASE_API_KEY: z.string().min(1).optional(),
  FIREBASE_AUTH_DOMAIN: z.string().min(1).optional(),
  FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  FIREBASE_APP_ID: z.string().min(1).optional(),
  FIREBASE_MESSAGING_SENDER_ID: z.string().min(1).optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  FIREBASE_MEASUREMENT_ID: z.string().optional(),
  FIREBASE_DATABASE_URL: z.string().optional(),
  FIREBASE_VAPID_KEY: z.string().optional(),
  RECAPTCHA_SITE_KEY: z.string().optional(),
  USE_EMULATORS: boolish(false),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export const serverEnvSchema = z.object({
  APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DEMO_MODE: boolish(true),
  NEXT_PUBLIC_DEMO_MODE: boolish(true),

  FIREBASE_ADMIN_PROJECT_ID: z.string().min(1).default("civic-pulse-4a203"),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().optional().transform(parsePrivateKey),
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

  GEOCODER_BASE_URL: z.string().url().default("https://nominatim.openstreetmap.org"),
  GEOCODER_CONTACT_EMAIL: z.string().optional(),

  DEMO_CITIZEN_EMAIL: z.string().email().default("citizen@demo.civicpulse.invalid"),
  DEMO_AUTHORITY_EMAIL: z.string().email().default("roads@demo.civicpulse.invalid"),
  DEMO_ADMIN_EMAIL: z.string().email().default("admin@demo.civicpulse.invalid"),
  DEMO_PASSWORD: z.string().optional(),
  DEMO_ADMIN_PASSWORD: z.string().optional(),

  CRON_SECRET: z.string().min(16).default("dev-cron-secret-change-in-prod-32ch"),

  FEATURE_UPLOADS: boolish(false),
  FEATURE_PUSH: boolish(false),
  FEATURE_REVERSE_GEOCODE: boolish(false),
  FEATURE_APP_CHECK: boolish(false),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Authoritative list of production environment variables required for full deployment.
 * Used by scripts/check-env.ts and scripts/sync-env.ts.
 */
export const REQUIRED_PROD_ENV_VARS = [
  { name: "APP_URL", desc: "Production canonical URL (e.g. https://<your-vercel-domain>)", public: false },
  { name: "NEXT_PUBLIC_APP_URL", desc: "Public canonical app URL", public: true },
  { name: "NEXT_PUBLIC_FIREBASE_API_KEY", desc: "Firebase Web API key", public: true },
  { name: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", desc: "Firebase Auth domain (<project>.firebaseapp.com)", public: true },
  { name: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", desc: "Firebase Project ID", public: true },
  { name: "NEXT_PUBLIC_FIREBASE_APP_ID", desc: "Firebase Web App ID", public: true },
  { name: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", desc: "Firebase Cloud Messaging Sender ID", public: true },
  { name: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", desc: "Firebase Storage Bucket", public: true },
  { name: "FIREBASE_ADMIN_PROJECT_ID", desc: "Firebase Admin Project ID", public: false },
  { name: "FIREBASE_ADMIN_CLIENT_EMAIL", desc: "Firebase Admin Service Account Email", public: false },
  { name: "FIREBASE_ADMIN_PRIVATE_KEY", desc: "Firebase Admin Private Key (PEM format with \\n)", public: false },
  { name: "GEMINI_API_KEY", desc: "Google AI Studio Gemini API Key", public: false },
  { name: "ANALYSIS_TOKEN_SECRET", desc: "HMAC secret >= 32 chars (generate: openssl rand -hex 32)", public: false },
  { name: "DEMO_MODE", desc: "Enable seeded demo modes ('true' / 'false')", public: false },
  { name: "NEXT_PUBLIC_DEMO_MODE", desc: "Public demo flag matching DEMO_MODE", public: true },
  { name: "DEMO_PASSWORD", desc: "Password for seeded citizen and authority demo accounts", public: false },
  { name: "DEMO_ADMIN_PASSWORD", desc: "Password for real admin account (never expose in client or API)", public: false, sensitiveAdmin: true },
  { name: "CRON_SECRET", desc: "Secret bearer token for Vercel Cron endpoints (min 16 chars)", public: false },
] as const;
