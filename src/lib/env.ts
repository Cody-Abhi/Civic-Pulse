/**
 * Centralised, validated environment access (§40, §44).
 *
 * - `clientEnv` exposes only NEXT_PUBLIC_* values (safe for the browser bundle).
 *   Each is referenced statically so Next.js can inline it at build time.
 * - `getServerEnv()` validates server-only secrets lazily on first use, so that
 *   importing a module does not crash a build that lacks runtime credentials;
 *   the first request that actually needs a secret fails fast with a clear error.
 *
 * The server secrets live in `./server-env` which carries the `server-only`
 * guard, so they can never be pulled into a client component.
 */
import { z } from "zod";
import { clientEnvSchema, type ClientEnv } from "./env-schema";

export type { ClientEnv } from "./env-schema";

function readClientEnv(): ClientEnv {
  // Static references required for Next.js inlining — do not refactor into a loop.
  const parsed = clientEnvSchema.safeParse({
    APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    CITY_ID: process.env.NEXT_PUBLIC_CITY_ID,
    CITY_NAME: process.env.NEXT_PUBLIC_CITY_NAME,
    DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE || process.env.DEMO_MODE,
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
    FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    USE_EMULATORS: process.env.NEXT_PUBLIC_USE_EMULATORS,
    CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid NEXT_PUBLIC_* environment: ${z.prettifyError(parsed.error)}`,
    );
  }
  return parsed.data;
}

export const clientEnv: ClientEnv = readClientEnv();

/** True only when the required Firebase client config is present. */
export const isFirebaseClientConfigured = (): boolean =>
  Boolean(
    clientEnv.FIREBASE_API_KEY &&
      clientEnv.FIREBASE_AUTH_DOMAIN &&
      clientEnv.FIREBASE_PROJECT_ID &&
      clientEnv.FIREBASE_APP_ID,
  );
