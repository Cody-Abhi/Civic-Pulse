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

const boolish = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined ? def : v === "true" || v === "1"));

const clientSchema = z.object({
  APP_URL: z.url().default("http://localhost:3000"),
  CITY_ID: z.string().min(1).default("blr"),
  CITY_NAME: z.string().min(1).default("Bengaluru"),
  DEMO_MODE: boolish(true),
  FIREBASE_API_KEY: z.string().min(1).optional(),
  FIREBASE_AUTH_DOMAIN: z.string().min(1).optional(),
  FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  FIREBASE_APP_ID: z.string().min(1).optional(),
  FIREBASE_MESSAGING_SENDER_ID: z.string().min(1).optional(),
  FIREBASE_VAPID_KEY: z.string().optional(),
  RECAPTCHA_SITE_KEY: z.string().optional(),
  USE_EMULATORS: boolish(false),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
});

export type ClientEnv = z.infer<typeof clientSchema>;

function readClientEnv(): ClientEnv {
  // Static references required for Next.js inlining — do not refactor into a loop.
  const parsed = clientSchema.safeParse({
    APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    CITY_ID: process.env.NEXT_PUBLIC_CITY_ID,
    CITY_NAME: process.env.NEXT_PUBLIC_CITY_NAME,
    DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
    FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
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
